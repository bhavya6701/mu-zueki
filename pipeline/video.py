"""Render a day's reel with HyperFrames: python -m pipeline.video [YYYY-MM-DD]

Uses the day's finished audio.mp3 and timeline.json and the scenes in reel/days/DATE/. Writes
output/DATE/reel.mp4. It never calls ElevenLabs. The scenes are written by Claude from a reference
video (see .claude/skills/run-pipeline); this module only prepares, renders and checks.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

from .day import Day
from .settings import DATE_RE, OUTPUT_DIR, ROOT, RunError, log

REEL_DIR = ROOT / "reel"
SIZE = (1080, 1920)
FPS = 60
# The block of index.html that lists the scenes of the day being rendered.
DAY_BLOCK = re.compile(r"(<!-- day:start[^>]*-->\n).*?([ \t]*<!-- day:end -->)", re.S)


def _tool(name: str) -> str:
    """Path of a command-line tool. FFmpeg from winget sits in a folder that old shells do not have on PATH."""
    found = shutil.which(name)
    if not found:
        links = Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Links" / f"{name}.exe"
        found = str(links) if links.exists() else None
    if not found:
        raise RunError(f"{name} was not found on PATH")
    return found


def _run(args: list[str], timeout: int, cwd: Path = REEL_DIR) -> subprocess.CompletedProcess:
    return subprocess.run(args, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace",
                          timeout=timeout)


def scenes_for(date: str, reel_dir: Path = REEL_DIR) -> list[Path]:
    """The day's scene files in the order they run (file-name order)."""
    return sorted((reel_dir / "days" / date).glob("*.js"))


def prepare(day: Day, reel_dir: Path = REEL_DIR) -> None:
    """Point the reel project at this day: its song, its timings, its length and its scenes."""
    scenes = scenes_for(day.date, reel_dir)
    if not scenes:
        raise RunError(f"No scenes for {day.date} yet (expected reel/days/{day.date}/*.js). "
                       "Ask Claude to run the pipeline: it writes them from a reference video.")
    for needed in (day.audio_mp3, day.timeline_json):
        if not needed.exists():
            raise RunError(f"{needed.name} is missing for {day.date}; run the song pipeline first")
    timeline = day.read_json(day.timeline_json)

    shutil.copyfile(day.audio_mp3, reel_dir / "audio.mp3")
    (reel_dir / "data").mkdir(exist_ok=True)
    # A render must not fetch, so the timings are loaded as a script.
    (reel_dir / "data" / "timeline.js").write_text(
        f"window.TIMELINE = {json.dumps(timeline, ensure_ascii=False)};\n", encoding="utf-8")

    index = reel_dir / "index.html"
    html = index.read_text(encoding="utf-8")
    tags = "".join(f'    <script src="days/{day.date}/{scene.name}"></script>\n' for scene in scenes)
    html, blocks = DAY_BLOCK.subn(lambda m: m.group(1) + tags + m.group(2), html)
    # The length is on the composition root and on the song; both carry data-duration.
    html, lengths = re.subn(r'data-duration="[^"]*"', f'data-duration="{timeline["duration_seconds"]}"', html)
    if blocks != 1 or lengths != 2:
        raise RunError("reel/index.html no longer has its day block and two data-duration attributes")
    index.write_text(html, encoding="utf-8")


def probe(path: Path) -> dict:
    """Streams and duration of a media file."""
    result = _run([_tool("ffprobe"), "-v", "error", "-show_entries",
                   "stream=codec_type,width,height,r_frame_rate,pix_fmt:format=duration", "-of", "json", str(path)],
                  timeout=120, cwd=ROOT)
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        raise RunError(f"Could not read {path.name}: {(result.stderr or result.stdout)[-300:]}")


def check_reel(info: dict, song_seconds: float) -> list[str]:
    """Problems with a rendered reel; an empty list means it is good."""
    problems = []
    streams = info.get("streams", [])
    video = next((s for s in streams if s.get("codec_type") == "video"), None)
    if video is None:
        problems.append("the file has no video stream")
    else:
        if (video.get("width"), video.get("height")) != SIZE:
            problems.append(f"the video is {video.get('width')}x{video.get('height')}, not {SIZE[0]}x{SIZE[1]}")
        if video.get("r_frame_rate") != f"{FPS}/1":
            problems.append(f"the frame rate is {video.get('r_frame_rate')}, not {FPS}/1")
        if video.get("pix_fmt") != "yuv420p":
            problems.append(f"the pixel format is {video.get('pix_fmt')}, not yuv420p")
    if not any(s.get("codec_type") == "audio" for s in streams):
        problems.append("the file has no audio stream, so the song would not play")
    length = float(info.get("format", {}).get("duration", 0))
    if abs(length - song_seconds) > 0.2:
        problems.append(f"the video lasts {length:.2f}s but the song lasts {song_seconds:.2f}s")
    return problems


def render(day: Day) -> list[str]:
    """Render output/DATE/reel.mp4. Returns problems found in the result (empty when it is good)."""
    prepare(day)
    npx = _tool("npx")
    check = _run([npx, "hyperframes", "check", "."], timeout=600)
    if check.returncode != 0:
        raise RunError("The scenes did not pass hyperframes check:\n" + (check.stdout or check.stderr)[-1500:])

    reel = day.dir / "reel.mp4"
    log(f"video: rendering {day.date} (a few minutes)")
    result = _run([npx, "hyperframes", "render", ".", "--fps", str(FPS), "--quality", "delivery",
                   "--workers", "4", "--output", str(reel)], timeout=3600)
    if result.returncode != 0 or not reel.exists():
        raise RunError("HyperFrames could not render the reel:\n" + (result.stderr or result.stdout)[-1500:])
    problems = check_reel(probe(reel), day.read_json(day.timeline_json)["duration_seconds"])
    log(f"video: wrote {reel}" + ("" if not problems else "; problems: " + "; ".join(problems)))
    return problems


def main() -> int:
    if sys.stdout is not None and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    days = sorted(d.name for d in OUTPUT_DIR.iterdir() if d.is_dir() and DATE_RE.match(d.name)) if OUTPUT_DIR.is_dir() else []
    date = sys.argv[1] if len(sys.argv) > 1 else (days[-1] if days else None)
    if not date or not DATE_RE.match(date):
        log("video: FAILED: give a date such as 2026-10-06, or make a song first")
        return 1
    try:
        return 2 if render(Day(OUTPUT_DIR, date)) else 0
    except RunError as exc:
        log(f"video: FAILED: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
