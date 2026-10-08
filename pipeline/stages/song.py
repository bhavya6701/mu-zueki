"""Stage 1: Claude writes the song from the news file; it is checked, fact-checked and repaired once."""
from __future__ import annotations

import json
from pathlib import Path

from .. import claude_cli
from ..checks import check_song
from ..day import DONE, FAILED, Day, StageResult
from ..settings import DATE_RE, OUTPUT_DIR, PROMPT_DIR, log

NAME = "song"
PROMPT_FILES = ("persona.md", "elevenlabs_format.md")
SCHEMA_PATH = Path(__file__).resolve().parent.parent / "song_schema.json"
HIT_WEIGHTS = {
    "bars": 0.20, "flow": 0.20, "hook": 0.20, "production": 0.15,
    "reel": 0.10, "emotion": 0.10, "structure": 0.05,
}

VERIFIER_SCHEMA = {
    "type": "object",
    "required": ["pass", "issues"],
    "properties": {"pass": {"type": "boolean"}, "issues": {"type": "array", "items": {"type": "string"}}},
}
VERIFIER_SYSTEM = """You are a strict fact checker for a daily finance-news song.
You receive the song's lyrics, its on-screen captions, its post caption, and the news file it was
written from. The news file is the only source of truth.

Report an issue for each of these, quoting the offending line:
1. A number, name, company, event or cause in the song that the news file does not support, or
   that has the wrong direction, scale or unit. Rounding for flow is fine ("nearly six trillion"
   for 5.84 trillion); changing what happened is not.
2. A precise figure taken from a story marked partially_verified when that story's
   fact_check.notes say the figure is single-sourced or disputed. A rounded version is fine.
3. Anything telling the listener to buy, sell or hold, or predicting prices.
4. An invented accusation or insult about a real person or company.

Metaphor, wordplay, attitude and profanity are not issues unless they state something false.
Set pass to true only when there are no issues. Keep each issue to one sentence."""


def system_prompt(prompt_dir: Path = PROMPT_DIR) -> str:
    return "\n\n---\n\n".join((prompt_dir / name).read_text(encoding="utf-8") for name in PROMPT_FILES)


def recent_hooks(output_dir: Path, before_date: str, n: int) -> list[str]:
    if n <= 0 or not output_dir.is_dir():
        return []
    days = sorted(
        (d.name for d in output_dir.iterdir() if d.is_dir() and DATE_RE.match(d.name) and d.name < before_date),
        reverse=True,
    )
    hooks = []
    for name in days:
        try:
            hook = json.loads((output_dir / name / "song.json").read_text(encoding="utf-8")).get("hook", "").strip()
        except (OSError, json.JSONDecodeError):
            continue
        if hook:
            hooks.append(hook)
        if len(hooks) == n:
            break
    return hooks


def user_prompt(settings: dict, news_name: str, news_text: str, hooks: list[str],
                previous: dict | None = None, issues: list[str] | None = None) -> str:
    def choice(value, auto_text):
        return auto_text if value == "auto" else json.dumps(value)

    lines = [
        "Write today's song and return it through the structured output.",
        "",
        "SETTINGS",
        f"- Length: {settings['length_seconds']} seconds",
        f"- Vocal: {choice(settings['vocal'], 'your choice; say which')}",
        f"- Mood: {choice(settings['mood_override'], 'decide from the news')}",
        f"- Story focus: {choice(settings['story_focus'], 'your choice, following the persona rules')}",
    ]
    if settings["exclude_story_ranks"]:
        lines.append(f"- Do not use stories with these ranks: {settings['exclude_story_ranks']}")
    if not settings["explicit"]:
        lines.append("- Clean version: no profanity at all today (this overrides the uncensored rule)")
    if settings["extra_instructions"].strip():
        lines.append(f"- Extra instructions from Zueki: {settings['extra_instructions'].strip()}")
    if hooks:
        lines += ["", "RECENT HOOKS. Do not reuse these phrases or their central image:"]
        lines += [f"- {h!r}" for h in hooks]
    lines += ["", f"NEWS FILE ({news_name})", news_text]
    if previous is not None and issues:
        lines += [
            "",
            "YOUR PREVIOUS ATTEMPT FAILED REVIEW. Fix every issue below and return the full song again.",
            "ISSUES",
            *[f"- {i}" for i in issues],
            "",
            "PREVIOUS ATTEMPT",
            json.dumps(previous, ensure_ascii=False, indent=1),
        ]
    return "\n".join(lines)


def fact_check(song: dict, news_text: str, model: str, ask=claude_cli.ask) -> list[str]:
    user = "\n".join([
        "LYRICS", *[c["text"] for c in song["plan"]["chunks"]], "",
        "CAPTIONS", *[c["text"] for c in song["captions"]], "",
        "POST CAPTION", song["post_caption"], "",
        "NEWS FILE", news_text,
    ])
    verdict = ask(VERIFIER_SYSTEM, user, VERIFIER_SCHEMA, model, timeout=600)
    issues = [str(i) for i in verdict.get("issues", [])]
    if not verdict.get("pass") and not issues:
        issues = ["The fact checker failed the song without listing a reason"]
    return [] if verdict.get("pass") else issues


def hit_total(score: dict) -> float:
    return round(sum(score[k] * w for k, w in HIT_WEIGHTS.items()), 2)


def render_markdown(song: dict, news_name: str, issues: list[str]) -> str:
    out = [f"# Mu-Zueki: {song['news_date']}", ""]
    if issues:
        out += ["> **NEEDS REVIEW.** No audio was generated because of:", *[f"> - {i}" for i in issues], ""]
    out += [
        f"**{song['day_in_one_sentence']}**",
        "",
        f"- **News file:** {news_name}",
        "- **Stories:** " + "; ".join(f"#{s['rank']} {s['headline']} ({s['status']})" for s in song["stories_used"]),
        f"- **Mood:** {song['mood']['name']}. {song['mood']['reason']}",
    ]
    if song["mood"]["turn"].strip():
        out.append(f"- **Mood turn:** {song['mood']['turn']}")
    out += [f"- **Setup:** {song['vocal']} vocal, {song['bpm']} BPM", "", "## Lyrics and sound"]
    for n, c in enumerate(song["plan"]["chunks"], 1):
        out += [f"**Section {n}** ({c['duration_ms'] / 1000:g}s): {', '.join(c['positive_styles'])}", "```", c["text"], "```"]
    out += [
        "",
        "## Fact map",
        "| Lyric line | Claim | Story | Source text |",
        "|------------|-------|-------|-------------|",
        *[f"| {r['line']} | {r['claim']} | #{r['rank']} | {r['source_text']} |" for r in song["fact_map"]],
        "",
        "## Beat notes",
        song["beat_notes"],
        "",
        "## Reel notes",
        f"- **Opening grab:** {song['reel_notes']['opening_grab']}",
        f"- **Caption bar:** {song['reel_notes']['caption_bar']}",
        f"- **Cut points:** {song['reel_notes']['cut_points']}",
        f"- **Loop point:** {song['reel_notes']['loop_point']}",
        "",
        "## Hit score",
        "- " + ", ".join(f"{k} {song['hit_score'][k]:g}" for k in HIT_WEIGHTS) + f" = **{hit_total(song['hit_score'])} / 10**",
        f"- {song['hit_score']['notes']}",
    ]
    return "\n".join(out)


def run(day: Day, settings: dict, ask=claude_cli.ask) -> StageResult:
    news_text = day.news_path.read_text(encoding="utf-8")
    news = json.loads(news_text)
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    system = system_prompt()
    hooks = recent_hooks(OUTPUT_DIR, day.date, settings["avoid_repeating_last_n_days"])
    model = settings["claude_model"]

    def review(song: dict) -> list[str]:
        issues = check_song(song, news, settings)
        log(f"song: script checks found {len(issues)} issue(s)")
        checker = fact_check(song, news_text, model, ask)
        log(f"song: fact checker found {len(checker)} issue(s)")
        return issues + checker

    log(f"song: writing from {day.news_path.name}")
    song = ask(system, user_prompt(settings, day.news_path.name, news_text, hooks), schema, model)
    issues = review(song)
    if issues:
        for i in issues:
            log(f"song:   issue: {i}")
        log("song: asking for one repaired version")
        song = ask(system, user_prompt(settings, day.news_path.name, news_text, hooks, song, issues), schema, model)
        issues = review(song)

    song["news_date"] = day.date
    song["length_seconds"] = settings["length_seconds"]
    day.write_json(day.song_json, song)
    day.write_text(day.song_md, render_markdown(song, day.news_path.name, issues))
    day.write_text(day.caption_txt, song["post_caption"])
    # A song that failed its checks must not reach the audio stage: that would spend credits on it.
    return StageResult(FAILED if issues else DONE, issues)
