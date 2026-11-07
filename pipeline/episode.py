"""One week's folder (output/YYYY-Www/): where each stage's files live, and the status of each stage."""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from .settings import week_days

DONE, REVIEW, FAILED = "done", "needs_review", "failed"


@dataclass
class StageResult:
    """done: finished cleanly. needs_review: finished, but a person should check. failed: later stages must not run."""
    state: str = DONE
    notes: list[str] = field(default_factory=list)


class Episode:
    """One week of the series. `week` is an ISO week such as 2026-W44; `start` and `end` are its Monday and Friday."""

    def __init__(self, output_dir: Path, week: str, news_path: Path | None = None):
        self.week = week
        self.start, self.end = week_days(week)
        self.dir = output_dir / week
        self.news_path = news_path
        # Stage outputs. Stages talk to each other only through these files.
        self.song_json = self.dir / "song.json"         # song stage: lyrics, plan, captions, fact map
        self.song_md = self.dir / "song.md"             # song stage: the same, for reading
        self.caption_txt = self.dir / "caption.txt"     # song stage: text to post with the reel
        self.audio_mp3 = self.dir / "audio.mp3"         # audio stage: the chosen take, trimmed
        self.audio_json = self.dir / "audio.json"       # audio stage: what was heard in the take
        self.subtitles_srt = self.dir / "subtitles.srt"  # subtitles stage
        self.timeline_json = self.dir / "timeline.json"  # subtitles stage: timing data for video
        self.status_json = self.dir / "status.json"

    def read_json(self, path: Path) -> dict:
        return json.loads(path.read_text(encoding="utf-8"))

    def write_json(self, path: Path, data) -> None:
        self.dir.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    def write_text(self, path: Path, text: str) -> None:
        self.dir.mkdir(parents=True, exist_ok=True)
        path.write_text(text.rstrip("\n") + "\n", encoding="utf-8")

    def status(self) -> dict:
        return self.read_json(self.status_json) if self.status_json.exists() else {}

    def state(self, stage: str) -> str | None:
        return self.status().get(stage, {}).get("state")

    def mark(self, stage: str, result: StageResult) -> None:
        status = self.status()
        status[stage] = {"state": result.state, "notes": result.notes}
        self.write_json(self.status_json, status)

    def reset(self, stages: list[str]) -> None:
        status = {k: v for k, v in self.status().items() if k not in stages}
        if self.dir.exists():
            self.write_json(self.status_json, status)
