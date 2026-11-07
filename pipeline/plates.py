"""Bring Gemini frames into a week's reel: python -m pipeline.plates WEEK NAME [NAME ...] [--from FOLDER]

Gemini (Nano Banana, in the browser) saves its originals to Downloads as watermarked_img_*.jpg or
Gemini_Generated_Image*.jpg (since 2026-11, "Gemini_Generated_Image (2).jpeg" from the Library viewer). This takes the newest of them, as many as there are names, oldest first, so
the frames must be downloaded in the order the names are given. Each is kept as it came in
reel/media/WEEK/plates/originals/ and scaled to fill the 1080x1920 frame (Lanczos, centre crop) as
reel/media/WEEK/plates/NAME.jpg. plates.json records where each came from, and plates_sheet.jpg puts
them side by side so they can be checked before anything is built on them: the "Download full size"
button in Gemini has saved the wrong image before.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

from .settings import ROOT, WEEK_RE, RunError, log
from .video import SIZE, _run, _tool

MEDIA_DIR = ROOT / "reel" / "media"
DOWNLOADS = Path.home() / "Downloads"
PATTERNS = ("watermarked_img_*.jpg", "Gemini_Generated_Image*.jpg", "Gemini_Generated_Image*.jpeg", "Gemini_Generated_Image*.png")


def newest(folder: Path, count: int) -> list[Path]:
    """The `count` newest Gemini downloads in `folder`, oldest first."""
    found = sorted({p for pattern in PATTERNS for p in folder.glob(pattern)}, key=lambda p: p.stat().st_mtime)
    if len(found) < count:
        raise RunError(f"Only {len(found)} Gemini download(s) in {folder}; {count} are needed")
    return found[-count:]


def fill_frame(source: Path, target: Path, size: tuple[int, int] = SIZE) -> None:
    """Scale to cover the frame, then crop the middle, with Lanczos (an upscale stays soft, not blocky)."""
    w, h = size
    vf = f"scale={w}:{h}:force_original_aspect_ratio=increase:flags=lanczos,crop={w}:{h}"
    result = _run([_tool("ffmpeg"), "-v", "error", "-y", "-i", str(source), "-vf", vf, "-q:v", "2", str(target)],
                  timeout=120, cwd=ROOT)
    if result.returncode != 0:
        raise RunError(f"Could not scale {source.name}: {(result.stderr or result.stdout)[-300:]}")


def contact_sheet(plates: list[Path], target: Path) -> None:
    """The plates side by side at 270x480, so a wrong or misnamed frame shows at a glance."""
    args = [_tool("ffmpeg"), "-v", "error", "-y"]
    for plate in plates:
        args += ["-i", str(plate)]
    scaled = "".join(f"[{n}]scale=270:480[p{n}];" for n in range(len(plates)))
    if len(plates) == 1:
        graph = scaled + "[p0]copy[out]"
    else:
        layout = "|".join(f"{270 * n}_0" for n in range(len(plates)))
        graph = scaled + "".join(f"[p{n}]" for n in range(len(plates))) + f"xstack=inputs={len(plates)}:layout={layout}[out]"
    result = _run(args + ["-filter_complex", graph, "-map", "[out]", "-frames:v", "1", str(target)], timeout=120, cwd=ROOT)
    if result.returncode != 0:
        raise RunError(f"Could not make the contact sheet: {(result.stderr or result.stdout)[-300:]}")


def bring_in(week: str, names: list[str], downloads: Path = DOWNLOADS, media_dir: Path = MEDIA_DIR) -> Path:
    """Move the newest downloads into the week's plates folder under `names`. Returns the folder."""
    if not WEEK_RE.match(week):
        raise RunError(f"'{week}' is not a week like 2026-W44")
    if len(set(names)) != len(names):
        raise RunError("Each plate needs its own name")
    folder = media_dir / week / "plates"
    (folder / "originals").mkdir(parents=True, exist_ok=True)
    record_path = folder / "plates.json"
    record = json.loads(record_path.read_text(encoding="utf-8")) if record_path.exists() else {}
    for name, source in zip(names, newest(downloads, len(names))):
        original = folder / "originals" / f"{name}{source.suffix.lower()}"
        shutil.move(str(source), original)
        fill_frame(original, folder / f"{name}.jpg")
        record[name] = {"file": f"media/{week}/plates/{name}.jpg", "original": original.name, "downloaded_as": source.name}
        log(f"plates: {source.name} -> {name}.jpg")
    record_path.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    contact_sheet([folder / f"{name}.jpg" for name in record], folder / "plates_sheet.jpg")
    return folder


def main() -> int:
    parser = argparse.ArgumentParser(prog="pipeline.plates", description="Bring Gemini frames into a week's reel.")
    parser.add_argument("week", help="the week, such as 2026-W44")
    parser.add_argument("names", nargs="+", help="a name for each frame, in the order they were downloaded")
    parser.add_argument("--from", dest="folder", default=str(DOWNLOADS), help="where the downloads are (default: Downloads)")
    args = parser.parse_args()
    try:
        folder = bring_in(args.week, args.names, Path(args.folder))
    except RunError as exc:
        log(f"plates: FAILED: {exc}")
        return 1
    log(f"plates: check {folder / 'plates_sheet.jpg'} before building on them")
    return 0


if __name__ == "__main__":
    sys.exit(main())
