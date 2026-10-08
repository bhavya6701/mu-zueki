"""Gather a day's top US finance news from the web and write raw_data/us_finance_news_DATE.json.

Claude researches the day with web search, the result is checked for shape and dates, a second Claude
call re-checks every story against its sources, and unsupported facts and stories are taken out.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path
from zoneinfo import ZoneInfo

from . import claude_cli
from .settings import DATE_RE, PROMPT_DIR, RunError, log

SCHEMA_PATH = Path(__file__).resolve().parent / "news_schema.json"
WEB_TOOLS = "WebSearch,WebFetch"
EASTERN = ZoneInfo("America/New_York")
WANTED_STORIES = 10
FEWEST_STORIES = 8

VERIFIER_SYSTEM = """You are a strict fact checker for a file of one day's US finance news.
For every story, open its references (and search for other established sources if a page will not
load) and check the headline, the summary and each key fact against what the sources say, and that
the story belongs to the stated day (US Eastern time).

Give each story one verdict:
- "confirmed": the event and every key fact are supported.
- "partly": the event is real and on that day, but some key facts are wrong or unsupported. List those
  key facts in wrong_facts, copied exactly as written in the file.
- "unsupported": the event did not happen, is from another day, or its main claim is wrong.
Say why in notes. Do not be lenient: a figure you could not find in a source is unsupported."""

VERIFIER_SCHEMA = {
    "type": "object",
    "required": ["stories"],
    "properties": {"stories": {"type": "array", "items": {
        "type": "object",
        "required": ["rank", "verdict", "wrong_facts", "notes"],
        "properties": {
            "rank": {"type": "integer"},
            "verdict": {"type": "string", "enum": ["confirmed", "partly", "unsupported"]},
            "wrong_facts": {"type": "array", "items": {"type": "string"}},
            "notes": {"type": "string"},
        },
    }}},
}


def news_path(news_dir: Path, date: str) -> Path:
    return news_dir / f"us_finance_news_{date}.json"


def check_news(research: dict, date: str) -> list[str]:
    """Problems with the researched stories that code can see; an empty list means the shape is good."""
    stories = research.get("stories", [])
    problems = []
    if len(stories) != WANTED_STORIES:
        problems.append(f"There are {len(stories)} stories; {WANTED_STORIES} are wanted "
                        "(fewer only if the limitations explain why)")
    if [s.get("rank") for s in stories] != list(range(1, len(stories) + 1)):
        problems.append("Ranks must run 1, 2, 3, ... in order")
    headlines = [s.get("headline", "").strip().lower() for s in stories]
    if len(set(headlines)) != len(headlines):
        problems.append("Two stories have the same headline")
    for story in stories:
        label = f"Story {story.get('rank')}"
        if story.get("event_date") != date:
            problems.append(f"{label}: event_date is {story.get('event_date')}, not {date}")
        if not story.get("headline", "").strip() or not story.get("summary", "").strip():
            problems.append(f"{label}: headline and summary must not be empty")
        if len(story.get("key_facts", [])) < 2:
            problems.append(f"{label}: needs at least two key facts")
        check = story.get("fact_check", {})
        references = check.get("references", [])
        if not references or not all(str(r.get("url", "")).startswith("http") for r in references):
            problems.append(f"{label}: needs at least one reference with a real URL")
        if check.get("status") == "verified" and len(references) < 2 and "primary" not in check.get("notes", "").lower():
            problems.append(f"{label}: 'verified' needs two references, or notes saying the one source is primary")
    return problems


def apply_verdicts(stories: list[dict], verdicts: list[dict]) -> tuple[list[dict], list[str]]:
    """Take out what the fact checker rejected. Returns the kept stories (re-ranked) and what was changed."""
    by_rank = {v.get("rank"): v for v in verdicts}
    kept, changes = [], []
    for story in stories:
        verdict = by_rank.get(story["rank"])
        if verdict is None:
            # A story the checker skipped was not checked, so it cannot be called verified.
            story["fact_check"]["status"] = "partially_verified"
            changes.append(f"'{story['headline']}' was not re-checked and is marked partially_verified.")
        elif verdict["verdict"] == "unsupported":
            changes.append(f"Dropped '{story['headline']}': {verdict.get('notes', '').strip()}")
            continue
        elif verdict["verdict"] == "partly":
            wrong = set(verdict.get("wrong_facts", []))
            removed = [fact for fact in story["key_facts"] if fact in wrong]
            story["key_facts"] = [fact for fact in story["key_facts"] if fact not in wrong]
            story["fact_check"]["status"] = "partially_verified"
            story["fact_check"]["notes"] = (story["fact_check"].get("notes", "") + " Re-check: "
                                            + verdict.get("notes", "").strip()).strip()
            changes.append(f"'{story['headline']}': removed {len(removed)} key fact(s) the re-check could not support.")
            if len(story["key_facts"]) < 2:
                changes.append(f"Dropped '{story['headline']}': too few supported facts were left.")
                continue
        kept.append(story)
    for rank, story in enumerate(kept, start=1):
        story["rank"] = rank
    return kept, changes


def research_prompt(date: str, now: dt.datetime, problems: list[str] | None = None, previous: dict | None = None) -> str:
    day = dt.date.fromisoformat(date)
    lines = [
        f"Find the top {WANTED_STORIES} US finance news stories of {day:%A, %B} {day.day}, {day.year} ({date}).",
        f"It is now {now:%A, %B} {now.day}, {now.year}, {now:%H:%M} US Eastern time.",
        f"Every story's event_date must be {date}.",
    ]
    if problems:
        lines += ["", "Your previous answer had these problems. Fix them and return the whole answer again:",
                  *[f"- {p}" for p in problems], "", "PREVIOUS ANSWER", json.dumps(previous, ensure_ascii=False, indent=1)]
    return "\n".join(lines)


def gather(date: str, news_dir: Path, model: str, ask=claude_cli.ask, now: dt.datetime | None = None) -> Path:
    """Research, check and write the news file for `date`. Raises RunError if the day cannot be trusted."""
    now = now or dt.datetime.now(EASTERN)
    if not DATE_RE.match(date):
        raise RunError(f"'{date}' is not a date like 2026-10-06")
    if dt.date.fromisoformat(date) > now.date():
        raise RunError(f"{date} is in the future (it is {now:%Y-%m-%d} in New York)")
    system = (PROMPT_DIR / "news_research.md").read_text(encoding="utf-8")
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))

    log(f"news: researching {date} on the web (several minutes)")
    research = ask(system, research_prompt(date, now), schema, model, timeout=2400, tools=WEB_TOOLS)
    if not research.get("ready", True):
        raise RunError(f"The news for {date} is not ready: {research.get('not_ready_reason', 'no reason given')}")
    problems = check_news(research, date)
    explained = len(research.get("stories", [])) < WANTED_STORIES and research.get("limitations")
    if problems and not (explained and len(problems) == 1 and "stories;" in problems[0]):
        log("news: repairing: " + "; ".join(problems))
        research = ask(system, research_prompt(date, now, problems, research), schema, model, timeout=2400, tools=WEB_TOOLS)
        problems = [p for p in check_news(research, date) if "stories;" not in p]
        if problems:
            raise RunError("The researched news still has problems: " + "; ".join(problems))

    log("news: re-checking every story against its sources")
    verdicts = ask(VERIFIER_SYSTEM, json.dumps(research["stories"], ensure_ascii=False, indent=1),
                   VERIFIER_SCHEMA, model, timeout=2400, tools=WEB_TOOLS).get("stories", [])
    stories, changes = apply_verdicts(research["stories"], verdicts)
    if len(stories) < FEWEST_STORIES:
        raise RunError(f"Only {len(stories)} stories for {date} survived the fact check; at least "
                       f"{FEWEST_STORIES} are needed. " + " ".join(changes))

    day = dt.date.fromisoformat(date)
    start = dt.datetime.combine(day, dt.time(0), EASTERN)
    data = {
        "metadata": {
            "title": "Top US Finance News",
            "generated_at": now.isoformat(timespec="seconds"),
            "timezone": "America/New_York",
            "coverage_window": {"from": start.isoformat(), "to": start.replace(hour=23, minute=59, second=59).isoformat()},
            "story_count": len(stories),
            "ranking_basis": research.get("ranking_basis", ""),
            "fact_check_method": "Researched by web search, then every story was re-checked against its sources in a "
                                 "second pass; facts and stories the re-check could not support were removed.",
            "verification_status_legend": {
                "verified": "Key facts confirmed by a primary source or by two or more independent sources",
                "partially_verified": "Core event confirmed, but one or more specific figures rest on a single source or sources conflict",
            },
            "limitations": ["Compiled by the pipeline's news step by web search."] + list(research.get("limitations", [])) + changes,
        },
        "stories": stories,
    }
    path = news_path(news_dir, date)
    news_dir.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    log(f"news: wrote {path.name} with {len(stories)} stories" + "".join(f"\n    - {c}" for c in changes))
    return path
