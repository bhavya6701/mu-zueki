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

NEWS_FILE_RE = re.compile(r"^us_finance_news_(\d{4}-\d{2}-\d{2})\.json$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

DEFAULTS = {
    "news_date": "latest",
    "length_seconds": 45,
    "vocal": "auto",
    "mood_override": "auto",
    "story_focus": "auto",
    "exclude_story_ranks": [],
    "explicit": True,
    "extra_instructions": "",
    "avoid_repeating_last_n_days": 3,
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

    if cfg["news_date"] != "latest" and not (isinstance(cfg["news_date"], str) and DATE_RE.match(cfg["news_date"])):
        raise SettingsError("news_date must be 'latest' or a date like '2026-10-06'")
    if cfg["length_seconds"] not in (30, 45, 60):
        raise SettingsError("length_seconds must be 30, 45 or 60")
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
    whole("avoid_repeating_last_n_days", 0)
    if not isinstance(cfg["claude_model"], str) or not cfg["claude_model"].strip():
        raise SettingsError("claude_model must be a Claude model alias such as 'opus'")
    if cfg["elevenlabs_model"] not in ("music_v2", "music_v2_5"):
        raise SettingsError("elevenlabs_model must be 'music_v2' or 'music_v2_5'")
    whole("max_takes", 1)
    whole("max_credits_per_song", 1)
    return cfg


def find_news_file(news_dir: Path, news_date: str = "latest") -> tuple[Path, str]:
    dated = {}
    if news_dir.is_dir():
        for p in news_dir.iterdir():
            m = NEWS_FILE_RE.match(p.name)
            if m:
                dated[m.group(1)] = p
    if not dated:
        raise RunError(f"No us_finance_news_YYYY-MM-DD.json file found in {news_dir}")
    if news_date == "latest":
        news_date = max(dated)
    elif news_date not in dated:
        raise RunError(f"No news file for {news_date} in {news_dir}")
    return dated[news_date], news_date
