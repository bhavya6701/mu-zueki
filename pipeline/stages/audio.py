"""Stage 2: generate the song with ElevenLabs, listen to each take, keep the best one.

A take passes when its opening lines and most of its lyrics are actually sung. A failing take is
regenerated, up to max_takes, within the per-song credit cap. Any music before the first sung
word is then cut off, so the vocal starts in the first moments of the file.
"""
from __future__ import annotations

import csv
import datetime as dt
import shutil
from pathlib import Path

from .. import elevenlabs, listen
from ..day import DONE, FAILED, REVIEW, Day, StageResult
from ..settings import OUTPUT_DIR, log
from ..text import lyric_tokens

NAME = "audio"
# In test generations music_v2 sang the opening lines from 0:00 every time (4 of 4), so retakes use it.
FALLBACK_MODEL = "music_v2"
MIN_OPENING_COVERAGE = 0.5  # share of the first section's words that must be heard
MIN_COVERAGE = 0.6          # share of all the lyric words that must be heard
# Clear takes scored 0.67 to 0.91 with Whisper small.en; takes with a skipped opening scored 0 to 0.13.
NUMBER_WORDS = frozenset(
    "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen "
    "seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand "
    "million billion trillion point percent".split()
)
TRIM_ABOVE_SECONDS = 0.3
TRIM_PREROLL_SECONDS = 0.1
USAGE_FIELDS = ("when", "news_date", "takes", "models", "estimated_credits", "measured_credits", "credits_left")


def scorable(tokens: list[str]) -> list[str]:
    """Lyric tokens a transcript can be expected to reproduce.

    Whisper writes spoken numbers and spelled-out letters its own way ("7800" for "seventy-eight
    hundred", "smp" for "S and P"), so those are left out of the score; counting them made fully
    sung, number-heavy sections look half missing.
    """
    return [t for t in tokens if len(t) > 1 and t not in NUMBER_WORDS and t != "and"] or tokens


def assess(song: dict, words: list[listen.Word]) -> dict:
    """What was heard against what was written."""
    sections = [scorable(lyric_tokens(chunk["text"])) for chunk in song["plan"]["chunks"]]
    matched = listen.match([tok for sec in sections for tok in sec], words)
    per_section, pos = [], 0
    for sec in sections:
        per_section.append(round(listen.coverage(matched[pos:pos + len(sec)]), 2) if sec else None)
        pos += len(sec)
    return {
        "start_seconds": listen.vocal_onset(matched, words),
        "coverage": round(listen.coverage(matched), 2),
        "section_coverage": per_section,
    }


def problems(report: dict) -> list[str]:
    found = []
    opening = report["section_coverage"][0] or 0.0
    if opening < MIN_OPENING_COVERAGE:
        found.append(f"the opening lines were not sung clearly (only {opening:.0%} of their words were heard)")
    if report["start_seconds"] is None:
        found.append("no lyrics were heard at all")
    if report["coverage"] < MIN_COVERAGE:
        found.append(f"only {report['coverage']:.0%} of the lyric words were heard clearly")
    return found


def score(report: dict) -> float:
    return (0 if problems(report) else 10) + report["coverage"] + (report["section_coverage"][0] or 0.0)


def read_usage(ledger: Path) -> list[dict]:
    if not ledger.exists():
        return []
    with open(ledger, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def credits_charged(row: dict) -> int:
    """What a past run cost: the measured figure when the balance showed one, otherwise the estimate."""
    return int(row["measured_credits"] or 0) or int(row["estimated_credits"])


def record_usage(ledger: Path, row: dict) -> None:
    new = not ledger.exists()
    ledger.parent.mkdir(parents=True, exist_ok=True)
    with open(ledger, "a", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=USAGE_FIELDS)
        if new:
            writer.writeheader()
        writer.writerow(row)


def run(day: Day, settings: dict, compose=None, transcribe=None, get_credits=None, ledger: Path | None = None
        ) -> StageResult:
    compose = compose or elevenlabs.compose
    transcribe = transcribe or listen.transcribe
    get_credits = get_credits or elevenlabs.get_credits
    ledger = ledger or OUTPUT_DIR / "usage.csv"

    api_key = elevenlabs.load_api_key()
    if not api_key:
        return StageResult(FAILED, ["No ElevenLabs API key found. Put ELEVENLABS_API_KEY=your-key in config\\.env"])
    song = day.read_json(day.song_json)
    plan = song["plan"]
    estimate = elevenlabs.estimate_credits(plan)
    cap = settings["max_credits_per_song"]
    spent = sum(credits_charged(r) for r in read_usage(ledger) if r["news_date"] == day.date)
    before = get_credits(api_key)
    if before is not None and before[1] - before[0] < estimate:
        return StageResult(FAILED, [f"Not enough ElevenLabs credits: {before[1] - before[0]} left, about {estimate} needed"])

    takes_dir = day.dir / "takes"
    takes_dir.mkdir(parents=True, exist_ok=True)
    best, models, notes = None, [], []
    for n in range(1, settings["max_takes"] + 1):
        if spent + estimate * (len(models) + 1) > cap:
            notes.append(f"stopped at the credit cap of {cap} for this song (max_credits_per_song)")
            break
        model = settings["elevenlabs_model"] if n == 1 else FALLBACK_MODEL
        log(f"audio: take {n} with {model} (about {estimate} credits)")
        try:
            audio = compose(api_key, plan, model)
        except elevenlabs.AudioError as exc:
            notes.append(str(exc))
            break
        models.append(model)
        path = takes_dir / f"take_{n}.mp3"
        path.write_bytes(audio)
        words = transcribe(path)
        report = dict(assess(song, words), take=n, model=model, path=path, words=words)
        issues = problems(report)
        start = "none" if report["start_seconds"] is None else f"{report['start_seconds']:.1f}s"
        log(f"audio: take {n}: first lyric at {start}, {report['coverage']:.0%} of words heard"
            + (f"; rejected: {'; '.join(issues)}" if issues else "; accepted"))
        if best is None or score(report) > score(best):
            best = report
        if not issues:
            break

    if models:
        after = get_credits(api_key)
        measured = (after[0] - before[0]) or None if before is not None and after is not None else None
        record_usage(ledger, {
            "when": f"{dt.datetime.now():%Y-%m-%d %H:%M:%S}", "news_date": day.date, "takes": len(models),
            "models": " ".join(models), "estimated_credits": estimate * len(models),
            "measured_credits": "" if measured is None else measured,
            "credits_left": "" if after is None else after[1] - after[0],
        })
        log(f"audio: {len(models)} take(s), "
            + (f"{measured} credits by the account balance" if measured else f"about {estimate * len(models)} credits (estimate)"))
    if best is None:
        shutil.rmtree(takes_dir, ignore_errors=True)
        return StageResult(FAILED, notes or ["no take could be generated"])

    # Keep the best take; cut any lead-in so the first lyric lands in the first moments.
    words, trimmed = best["words"], 0.0
    start = best["start_seconds"]
    if start is not None and start > TRIM_ABOVE_SECONDS:
        trimmed = round(start - TRIM_PREROLL_SECONDS, 3)
        listen.trim_start(best["path"], day.audio_mp3, trimmed)
        words = [(w, round(s - trimmed, 3), round(e - trimmed, 3)) for w, s, e in words if s >= trimmed]
        best = dict(best, start_seconds=round(start - trimmed, 3))
        log(f"audio: trimmed {trimmed:.2f}s of lead-in")
    else:
        shutil.copyfile(best["path"], day.audio_mp3)
    issues = problems(best)
    day.write_json(day.audio_json, {
        "take": best["take"], "takes_made": len(models), "model": best["model"],
        "duration_seconds": round(listen.duration(day.audio_mp3), 2), "trimmed_seconds": trimmed,
        "first_lyric_seconds": best["start_seconds"], "coverage": best["coverage"],
        "section_coverage": best["section_coverage"], "problems": issues,
        "heard": " ".join(w[0] for w in words), "words": [list(w) for w in words],
    })
    shutil.rmtree(takes_dir, ignore_errors=True)
    return StageResult(REVIEW if issues else DONE, issues + notes)
