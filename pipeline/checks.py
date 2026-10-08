"""Deterministic checks on a written song. Each returns a list of issues; an empty list means it passed."""
from __future__ import annotations

import difflib
import re

from .text import LABEL_RE, lyric_lines, lyric_tokens, tokenize

NUMBER_RE = re.compile(r"\d+(?:,\d{3})*(?:\.\d+)?")
NUMBER_TOLERANCE = 0.10
SUNG_SIGNATURE = "mew-zookie"
DISPLAY_SIGNATURE = "mu-zueki"
MAX_SIGNATURE_USES = 2
ADVICE_LINE = "Not financial advice."
# Style references from the persona; the music API rejects real artist names.
REFERENCE_ARTISTS = (
    "raftaar", "kr$na", "krsna", "chaar diwaari", "seedhe maut", "dhanji", "naam sujal",
    "vichaar", "eminem", "reble", "arpit bala", "anuv jain", "sez on the beat", "emiway",
)


def _norm(text: str) -> str:
    text = text.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", text).strip().lower()


def story_text(story: dict) -> str:
    parts = [story.get("headline", ""), story.get("summary", ""), story.get("event_date", "")]
    return " | ".join(parts + story.get("key_facts", []) + story.get("entities", []))


def extract_numbers(text: str) -> list[float]:
    return [float(m.replace(",", "")) for m in NUMBER_RE.findall(text)]


def check_plan(song: dict, settings: dict) -> list[str]:
    issues = []
    chunks = song["plan"]["chunks"]
    length = settings["length_seconds"]
    if not 1 <= len(chunks) <= 30:
        return [f"plan has {len(chunks)} chunks; it must have 1 to 30"]

    for n, chunk in enumerate(chunks, 1):
        if not 3000 <= chunk["duration_ms"] <= 120000:
            issues.append(f"plan chunk {n} lasts {chunk['duration_ms']} ms; each chunk must be 3000 to 120000 ms")
        lines = chunk["text"].splitlines()
        if len(lines) > 30 or len(chunk["text"]) > 6132:
            issues.append(f"plan chunk {n} is too long (limit: 30 lines, 6132 characters)")
        if any(len(line) > 200 for line in lines):
            issues.append(f"plan chunk {n} has a line over 200 characters")
        negative = chunk.get("negative_styles") or []
        if len(chunk["positive_styles"]) > 50 or len(negative) > 50:
            issues.append(f"plan chunk {n} has more than 50 styles in one list")
        named = [a for a in REFERENCE_ARTISTS if any(a in s.lower() for s in chunk["positive_styles"] + negative)]
        if named:
            issues.append(f"plan chunk {n} names real artists in its styles ({', '.join(named)})")
    if len(chunks[0]["positive_styles"]) < 6:
        issues.append("plan chunk 1 needs at least 6 positive_styles; they set the sound of the whole song")

    # The opening must be sung from the first second: a lyric line first, under a verse label.
    first_lines = [line.strip() for line in chunks[0]["text"].splitlines() if line.strip()]
    label = first_lines[0] if first_lines and LABEL_RE.fullmatch(first_lines[0]) else ""
    opening = next((line for line in first_lines if not LABEL_RE.fullmatch(line)), "")
    if not label.lower().startswith("[verse"):
        issues.append(
            f"plan chunk 1 is labelled {label or 'nothing'}; it must be labelled [Verse 1], because the music model "
            "plays an opening [Hook], [Chorus] or [Intro] as an instrumental"
        )
    if opening.startswith("{") or SUNG_SIGNATURE in opening.lower():
        issues.append("plan chunk 1 must open with a lyric line, not a cue or the Mew-Zookie signature")

    total = sum(c["duration_ms"] for c in chunks)
    if total > (length + 1) * 1000:
        issues.append(f"plan lasts {total / 1000:.1f}s; the reel is {length}s")
    elif total < length * 600:
        issues.append(f"plan lasts only {total / 1000:.1f}s of a {length}s reel")

    bpm = song["bpm"]
    if not 60 <= bpm <= 180:
        issues.append(f"bpm {bpm} is outside the usable range of 60 to 180")
    else:
        budget = length * bpm // 240
        bars = sum(len(lyric_lines(c["text"])) for c in chunks)
        if bars > budget + 2:
            issues.append(f"lyrics have {bars} bars; only about {budget} fit in {length} seconds at {bpm} BPM")
        elif bars < budget * 0.6:
            issues.append(f"lyrics have {bars} bars; about {budget} are needed to fill {length} seconds at {bpm} BPM")

    count = "\n".join(c["text"] for c in chunks).lower().count(SUNG_SIGNATURE)
    if not 1 <= count <= MAX_SIGNATURE_USES:
        issues.append(f"'Mew-Zookie' appears {count} times in the plan; it must appear 1 to {MAX_SIGNATURE_USES} times")
    return issues


def check_captions(song: dict) -> list[str]:
    issues = []
    chunks = song["plan"]["chunks"]
    captions = song["captions"]
    bad = sorted({c["section"] for c in captions if not 1 <= c["section"] <= len(chunks)})
    if bad:
        return [f"captions refer to section(s) {bad}; the plan has sections 1 to {len(chunks)}"]
    if [c["section"] for c in captions] != sorted(c["section"] for c in captions):
        issues.append("captions must be in sung order, with their section numbers never going backwards")

    for n, chunk in enumerate(chunks, 1):
        expected = lyric_tokens(chunk["text"])
        got = [t for c in captions if c["section"] == n for t in tokenize(c["sung"])]
        if expected and difflib.SequenceMatcher(None, expected, got, autojunk=False).ratio() < 0.9:
            issues.append(
                f"the captions for section {n} do not carry the same words as plan chunk {n}; "
                "every lyric line must be covered by captions whose 'sung' text copies it"
            )

    shown = sum(c["text"].lower().count(DISPLAY_SIGNATURE) for c in captions)
    if not 1 <= shown <= MAX_SIGNATURE_USES:
        issues.append(f"'Mu-Zueki' appears {shown} times in the captions; it must appear 1 to {MAX_SIGNATURE_USES} times")
    return issues


def check_facts(song: dict, news: dict, settings: dict) -> list[str]:
    issues = []
    stories = {s["rank"]: s for s in news.get("stories", [])}
    used = []
    for s in song["stories_used"]:
        if s["rank"] not in stories:
            issues.append(f"stories_used has rank {s['rank']}, which is not in the news file")
        elif s["rank"] in settings["exclude_story_ranks"]:
            issues.append(f"story rank {s['rank']} is excluded in the settings but was used")
        else:
            used.append(stories[s["rank"]])

    for row in song["fact_map"]:
        story = stories.get(row["rank"])
        if story is None:
            issues.append(f"fact_map row {row['line']!r} cites rank {row['rank']}, which is not in the news file")
        elif _norm(row["source_text"]) not in _norm(story_text(story)):
            issues.append(
                f"fact_map source_text {row['source_text']!r} is not found word for word in story rank {row['rank']}"
            )

    allowed = extract_numbers(" | ".join(story_text(s) for s in used))
    for cap in song["captions"]:
        for num in extract_numbers(cap["text"]):
            if not any(abs(num - a) <= NUMBER_TOLERANCE * max(abs(a), 1e-9) for a in allowed):
                issues.append(
                    f"caption {cap['text']!r} shows the number {num:g}, which is not close to any figure in the stories used"
                )

    if DISPLAY_SIGNATURE not in song["post_caption"].lower():
        issues.append("post_caption must include 'Mu-Zueki'")
    if not song["post_caption"].rstrip().endswith(ADVICE_LINE):
        issues.append(f"post_caption must end with '{ADVICE_LINE}'")
    return issues


def check_song(song: dict, news: dict, settings: dict) -> list[str]:
    return check_plan(song, settings) + check_captions(song) + check_facts(song, news, settings)
