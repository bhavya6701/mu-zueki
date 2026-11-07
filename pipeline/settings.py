"""Paths, user settings and logging shared by every stage."""
from __future__ import annotations

import datetime as dt
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SETTINGS_PATH = ROOT / "config" / "settings.json"
ENV_PATH = ROOT / "config" / ".env"
PROMPT_DIR = ROOT / "prompts"
NEWS_DIR = ROOT / "raw_data"
OUTPUT_DIR = ROOT / "output"

NEWS_FILE_RE = re.compile(r"^us_finance_news_week_(\d{4}-W\d{2})\.json$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
WEEK_RE = re.compile(r"^\d{4}-W\d{2}$")  # an ISO week, the unit of the series: 2026-W44

LENGTHS = (45, 60, 90)  # reel lengths in seconds

DEFAULTS = {
    "news_week": "latest",
    "length_seconds": 60,
    "vocal": "auto",
    "mood_override": "auto",
    "story_focus": "auto",
    "exclude_story_ranks": [],
    "explicit": True,
    "extra_instructions": "",
    "avoid_repeating_last_n_weeks": 4,
    "claude_model": "opus",
    "elevenlabs_model": "music_v2_5",
    "max_takes": 3,
    "max_credits_per_song": 5000,
}


class SettingsError(ValueError):
    pass


class RunError(RuntimeError):
    pass


def log(message: str) -> None:
    line = f"{dt.datetime.now():%Y-%m-%d %H:%M:%S}  {message}"
    if sys.stdout is not None:
        print(line, flush=True)
    try:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_DIR / "pipeline.log", "a", encoding="utf-8") as fh:
            fh.write(line + "\n")
    except OSError:
        pass


def load_settings(path: Path = SETTINGS_PATH) -> dict:
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise SettingsError(f"Settings file not found: {path}")
    except json.JSONDecodeError as exc:
        raise SettingsError(f"{path.name} is not valid JSON: {exc}")
    return validate(raw)


def validate(raw: dict) -> dict:
    cfg = dict(DEFAULTS)
    cfg.update({k: v for k, v in raw.items() if not k.startswith("_")})
    unknown = sorted(set(cfg) - set(DEFAULTS))
    if unknown:
        raise SettingsError(f"Unknown field(s) in settings: {', '.join(unknown)}")

    def whole(name: str, minimum: int) -> None:
        if type(cfg[name]) is not int or cfg[name] < minimum:
            raise SettingsError(f"{name} must be a whole number of at least {minimum}")

    if cfg["news_week"] != "latest" and not (isinstance(cfg["news_week"], str) and WEEK_RE.match(cfg["news_week"])):
        raise SettingsError("news_week must be 'latest' or a week like '2026-W44'")
    if cfg["length_seconds"] not in LENGTHS:
        raise SettingsError("length_seconds must be " + ", ".join(map(str, LENGTHS[:-1])) + f" or {LENGTHS[-1]}")
    if cfg["vocal"] not in ("auto", "male", "female", "both"):
        raise SettingsError("vocal must be 'auto', 'male', 'female' or 'both'")
    if not isinstance(cfg["mood_override"], str) or not cfg["mood_override"].strip():
        raise SettingsError("mood_override must be 'auto' or a mood word")
    focus = cfg["story_focus"]
    if not ((isinstance(focus, str) and focus.strip())
            or (isinstance(focus, list) and focus and all(type(r) is int for r in focus))):
        raise SettingsError("story_focus must be 'auto', a keyword, or a list of story ranks")
    excluded = cfg["exclude_story_ranks"]
    if not isinstance(excluded, list) or not all(type(r) is int for r in excluded):
        raise SettingsError("exclude_story_ranks must be a list of story ranks, such as [7]")
    if type(cfg["explicit"]) is not bool:
        raise SettingsError("explicit must be true or false")
    if not isinstance(cfg["extra_instructions"], str):
        raise SettingsError("extra_instructions must be text")
    whole("avoid_repeating_last_n_weeks", 0)
    if not isinstance(cfg["claude_model"], str) or not cfg["claude_model"].strip():
        raise SettingsError("claude_model must be a Claude model alias such as 'opus'")
    if cfg["elevenlabs_model"] not in ("music_v2", "music_v2_5"):
        raise SettingsError("elevenlabs_model must be 'music_v2' or 'music_v2_5'")
    whole("max_takes", 1)
    whole("max_credits_per_song", 1)
    return cfg


def week_of(day: dt.date) -> str:
    """The ISO week a date falls in, such as 2026-W44."""
    year, week, _ = day.isocalendar()
    return f"{year}-W{week:02d}"


def week_days(week: str) -> tuple[dt.date, dt.date]:
    """Monday and Friday of an ISO week: the trading week the episode covers."""
    if not WEEK_RE.match(week):
        raise RunError(f"'{week}' is not a week like 2026-W44")
    monday = dt.date.fromisocalendar(int(week[:4]), int(week[6:]), 1)
    return monday, monday + dt.timedelta(days=4)


def last_finished_week(now: dt.datetime) -> str:
    """The newest week whose Friday session is over at `now` (New York time): this week from Friday 4:30 PM on."""
    week = week_of(now.date())
    friday = week_days(week)[1]
    if now.date() < friday or (now.date() == friday and now.time() < dt.time(16, 30)):
        week = week_of(now.date() - dt.timedelta(days=7))
    return week


def find_news_file(news_dir: Path, news_week: str = "latest") -> tuple[Path, str]:
    weeks = {}
    if news_dir.is_dir():
        for p in news_dir.iterdir():
            m = NEWS_FILE_RE.match(p.name)
            if m:
                weeks[m.group(1)] = p
    if not weeks:
        raise RunError(f"No us_finance_news_week_YYYY-Www.json file found in {news_dir}")
    if news_week == "latest":
        news_week = max(weeks)
    elif news_week not in weeks:
        raise RunError(f"No news file for {news_week} in {news_dir}")
    return weeks[news_week], news_week
