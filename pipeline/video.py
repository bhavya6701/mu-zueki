"""Render a week's reel with HyperFrames: python -m pipeline.video [YYYY-Www]

Uses the week's finished audio.mp3 and timeline.json and the scenes in reel/weeks/WEEK/. Writes
output/WEEK/reel.mp4. If the week has a reel/weeks/WEEK/footage.json, the stock clips it lists are cut to
their lyric lines (cropped to the frame, graded, silent) and placed under the scenes. Sound effects are not
mixed here: pipeline.sound places them over the rendered reel. It never calls ElevenLabs. The scenes are written by
Claude from a reference video (see .claude/skills/run-pipeline); this module only prepares, renders and checks.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

from .episode import Episode
from .settings import OUTPUT_DIR, ROOT, WEEK_RE, RunError, log

REEL_DIR = ROOT / "reel"
SIZE = (1080, 1920)
FPS = 60
# The HyperFrames CLI every check and render runs; reel/package.json pins the same one. Unpinned, npx resolves the
# newest release: with no terminal it silently installs and runs that untested version, and with one it asks
# first, where the captured output hides the question until the call times out. --yes with an exact version
# avoids both.
HYPERFRAMES = "hyperframes@0.9.12"
# The block of index.html that lists the scenes of the week being rendered.
SCENES_BLOCK = re.compile(r"(<!-- scenes:start[^>]*-->\n).*?([ \t]*<!-- scenes:end -->)", re.S)
# The block inside the composition root that holds the week's footage clips.
FOOTAGE_BLOCK = re.compile(r"(<!-- footage:start[^>]*-->\n).*?([ \t]*<!-- footage:end -->)", re.S)
FOOTAGE_FPS = 30
FOOTAGE_TAIL = 0.25  # seconds a cut clip runs past its slot, so a slot never ends on a missing frame


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


def scenes_for(week: str, reel_dir: Path = REEL_DIR) -> list[Path]:
    """The week's scene files in the order they run (file-name order)."""
    return sorted((reel_dir / "weeks" / week).glob("*.js"))


def moment(spec, timeline: dict) -> float:
    """A time in the song from a footage spec: seconds, "cap:N" (start of lyric line N), "word:N:I" (start
    of word I, from 0, of line N), "cut:N" (the first downbeat after the last word of line N starts) or "end"."""
    if isinstance(spec, (int, float)):
        return float(spec)
    kind, _, rest = str(spec).partition(":")
    captions = timeline["captions"]
    if kind == "end":
        return float(timeline["duration_seconds"])
    if kind == "cap":
        return float(captions[int(rest) - 1]["start"])
    if kind == "word":
        line, word = rest.split(":")
        return float(captions[int(line) - 1]["words"][int(word)]["start"])
    if kind == "cut":
        last = captions[int(rest) - 1]["words"][-1]["start"]
        return float(next((beat for beat in timeline["downbeats"] if beat > last + 0.15), last + 0.3))
    raise RunError(f"footage.json: {spec!r} is not a time (use seconds, cap:N, word:N:I, cut:N or end)")


def cut_clip(source: Path, target: Path, seconds: float, entry: dict) -> None:
    """One clip cut for its slot: from `from` seconds in, cropped to fill its rectangle, graded, silent."""
    x, y, width, height = entry.get("rect", [0, 0, *SIZE])
    fill = (f"scale={width}:{height}:force_original_aspect_ratio=increase,"
            f"crop={width}:{height}:(iw-{width})*{entry.get('x', 0.5)}:(ih-{height})*{entry.get('y', 0.5)}")
    if entry.get("fit"):
        # A subject wider than the frame on a black ground (an object on black): shown whole, not cropped.
        fill = f"scale={width}:-2,pad={width}:{height}:0:(oh-ih)*{entry.get('y', 0.5)}:black"
    # "look" is any chain of FFmpeg filters for the grade, such as "eq=contrast=1.1" or a colour mix.
    look = f",{entry['look']}" if entry.get("look") else ""
    args = [_tool("ffmpeg"), "-v", "error", "-y", "-ss", str(entry.get("from", 0)), "-i", str(source)]
    if entry.get("key"):
        # A green-screen clip: the green (or the clip's own screen colour, "screen") is replaced by a flat colour.
        screen = entry.get("screen", "0x00FF00")
        args += ["-f", "lavfi", "-i", f"color=c={entry['key']}:s={width}x{height}:r={FOOTAGE_FPS}", "-filter_complex",
                 f"[0:v]{fill},chromakey={screen}:0.2:0.08,fps={FOOTAGE_FPS}[fg];[1:v][fg]overlay=shortest=0{look}[v]", "-map", "[v]"]
    else:
        args += ["-vf", f"{fill},fps={FOOTAGE_FPS}{look}"]
    args += ["-t", f"{seconds + FOOTAGE_TAIL:.3f}", "-an", "-c:v", "libx264", "-crf", "18", "-preset", "medium",
             "-pix_fmt", "yuv420p", "-g", "15", "-movflags", "+faststart", str(target)]
    result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=900)
    if result.returncode != 0 or not target.exists():
        raise RunError(f"Could not cut {source.name} for the reel: {result.stderr.strip()[-300:]}")


def join_clips(parts: list[tuple[Path, float]], target: Path) -> None:
    """Cut clips played one after another as a single clip: each is trimmed to its slot, then they are joined."""
    partial = target.with_name(target.stem + ".part.mp4")
    args = [_tool("ffmpeg"), "-v", "error", "-y"]
    for source, _ in parts:
        args += ["-i", str(source)]
    # The last part keeps its tail, so the joined clip never ends on a missing frame either.
    trims = "".join(f"[{i}:v]" + (f"trim=duration={seconds:.3f}," if i < len(parts) - 1 else "") +
                    f"setpts=PTS-STARTPTS,fps={FOOTAGE_FPS},setsar=1,format=yuv420p[v{i}];" for i, (_, seconds) in enumerate(parts))
    graph = trims +"".join(f"[v{i}]" for i in range(len(parts))) + f"concat=n={len(parts)}:v=1:a=0[v]"
    args += ["-filter_complex", graph, "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "18", "-preset", "medium",
             "-pix_fmt", "yuv420p", "-g", "15", "-movflags", "+faststart", str(partial)]
    result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=900)
    if result.returncode != 0 or not partial.exists():
        partial.unlink(missing_ok=True)
        raise RunError(f"Could not join footage clips for the reel: {result.stderr.strip()[-300:]}")
    # Written under another name first, so a failed join never leaves a file that a later run would reuse.
    partial.replace(target)


def footage_tags(episode: Episode, timeline: dict, reel_dir: Path = REEL_DIR, cut=cut_clip, join=join_clips) -> str:
    """The <video> clips for the week's footage.json (cutting any that are not cut yet), as HTML.

    Entries that share a "join" label (back to back, same rectangle and track) are joined into one clip, so a
    reel with many short shots does not put dozens of <video> elements on the page (the check has a fixed
    time budget for loading them)."""
    manifest = reel_dir / "weeks" / episode.week / "footage.json"
    if not manifest.exists():
        return ""
    media = reel_dir / "media" / episode.week
    (media / "cut").mkdir(parents=True, exist_ok=True)
    tags = []
    groups: dict[str, dict] = {}
    for entry in json.loads(manifest.read_text(encoding="utf-8")):
        start, end = moment(entry["start"], timeline), moment(entry["end"], timeline)
        if end <= start:
            raise RunError(f"footage.json: {entry['id']} ends before it starts")
        source = media / f"{entry['clip']}.mp4"
        if not source.exists():
            raise RunError(f"footage.json: {source.name} is not in reel/media/{episode.week}/ (fetch it with pipeline.stock)")
        # The cut is named after everything that shapes it, so changing an entry makes a new file.
        shape = json.dumps({**{k: v for k, v in entry.items() if k not in ("id", "start", "end", "join")}, "s": round(end - start, 3)}, sort_keys=True)
        target = media / "cut" / f"{entry['id']}-{hashlib.sha1(shape.encode()).hexdigest()[:10]}.mp4"
        if not target.exists():
            cut(source, target, end - start, entry)
        x, y, width, height = entry.get("rect", [0, 0, *SIZE])
        tag = {"id": entry["id"], "file": target, "start": start, "end": end, "track": entry.get("track", 0), "rect": (x, y, width, height)}
        label = entry.get("join")
        if label is None:
            tags.append(tag)
            continue
        group = groups.get(label)
        if group is None:
            groups[label] = group = dict(tag, parts=[])
            tags.append(group)
        elif abs(group["end"] - start) > 0.002 or group["rect"] != tag["rect"] or group["track"] != tag["track"]:
            raise RunError(f"footage.json: {entry['id']} cannot join {label!r}: it must start where the last clip ends, in the same rectangle and track")
        group["parts"].append((target, end - start))
        group["end"] = end
    for group in groups.values():
        if len(group["parts"]) > 1:
            names = "".join(part.name for part, _ in group["parts"])
            group["file"] = media / "cut" / f"{group['id']}-join-{hashlib.sha1(names.encode()).hexdigest()[:10]}.mp4"
            if not group["file"].exists():
                join(group["parts"], group["file"])
    return "".join(
        f'      <video id="{t["id"]}" class="clip footage" src="media/{episode.week}/cut/{t["file"].name}" muted playsinline '
        f'data-start="{t["start"]:.3f}" data-duration="{t["end"] - t["start"]:.3f}" data-track-index="{t["track"]}" '
        f'style="left:{t["rect"][0]}px;top:{t["rect"][1]}px;width:{t["rect"][2]}px;height:{t["rect"][3]}px"></video>\n'
        for t in tags)


def prepare(episode: Episode, reel_dir: Path = REEL_DIR) -> None:
    """Point the reel project at this episode: its song, its timings, its length and its scenes."""
    scenes = scenes_for(episode.week, reel_dir)
    if not scenes:
        raise RunError(f"No scenes for {episode.week} yet (expected reel/weeks/{episode.week}/*.js). "
                       "Ask Claude to run the pipeline: it writes them from a reference video.")
    for needed in (episode.audio_mp3, episode.timeline_json):
        if not needed.exists():
            raise RunError(f"{needed.name} is missing for {episode.week}; run the song pipeline first")
    timeline = episode.read_json(episode.timeline_json)

    shutil.copyfile(episode.audio_mp3, reel_dir / "audio.mp3")
    (reel_dir / "data").mkdir(exist_ok=True)
    # A render must not fetch, so the timings are loaded as a script.
    (reel_dir / "data" / "timeline.js").write_text(
        f"window.TIMELINE = {json.dumps(timeline, ensure_ascii=False)};\n", encoding="utf-8")

    index = reel_dir / "index.html"
    html = index.read_text(encoding="utf-8")
    tags = "".join(f'    <script src="weeks/{episode.week}/{scene.name}"></script>\n' for scene in scenes)
    html, blocks = SCENES_BLOCK.subn(lambda m: m.group(1) + tags + m.group(2), html)
    # Last week's footage goes first, so the only lengths left are the composition root's and the song's.
    html, cleared = FOOTAGE_BLOCK.subn(lambda m: m.group(1) + m.group(2), html)
    html, lengths = re.subn(r'data-duration="[^"]*"', f'data-duration="{timeline["duration_seconds"]}"', html)
    if blocks != 1 or cleared != 1 or lengths != 2:
        raise RunError("reel/index.html no longer has its scenes block, its footage block and two data-duration attributes")
    clips = footage_tags(episode, timeline, reel_dir)
    html = FOOTAGE_BLOCK.sub(lambda m: m.group(1) + clips + m.group(2), html)
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


def render(episode: Episode) -> list[str]:
    """Render output/WEEK/reel.mp4. Returns problems found in the result (empty when it is good)."""
    prepare(episode)
    npx = _tool("npx")
    check = _run([npx, "--yes", HYPERFRAMES, "check", "."], timeout=600)
    if check.returncode != 0:
        raise RunError("The scenes did not pass hyperframes check:\n" + (check.stdout or check.stderr)[-1500:])

    reel = episode.dir / "reel.mp4"
    log(f"video: rendering {episode.week} (a few minutes)")
    result = _run([npx, "--yes", HYPERFRAMES, "render", ".", "--fps", str(FPS), "--quality", "delivery",
                   "--workers", "4", "--output", str(reel)], timeout=3600)
    if result.returncode != 0 or not reel.exists():
        raise RunError("HyperFrames could not render the reel:\n" + (result.stderr or result.stdout)[-1500:])
    problems = check_reel(probe(reel), episode.read_json(episode.timeline_json)["duration_seconds"])
    log(f"video: wrote {reel}" + ("" if not problems else "; problems: " + "; ".join(problems)))
    return problems


def main() -> int:
    if sys.stdout is not None and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    weeks = sorted(d.name for d in OUTPUT_DIR.iterdir() if d.is_dir() and WEEK_RE.match(d.name)) if OUTPUT_DIR.is_dir() else []
    week = sys.argv[1] if len(sys.argv) > 1 else (weeks[-1] if weeks else None)
    if not week or not WEEK_RE.match(week):
        log("video: FAILED: give a week such as 2026-W44, or make a song first")
        return 1
    try:
        return 2 if render(Episode(OUTPUT_DIR, week)) else 0
    except RunError as exc:
        log(f"video: FAILED: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
