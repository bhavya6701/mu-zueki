"""A week's sound effects: real recordings placed on the picture's own cues, over the song, then reviewed.

    python -m pipeline.sound cues WEEK      the picture's cue list, read from the built page
    python -m pipeline.sound kit            earshot's made-in-code kit as real-sfx's fallback library
    python -m pipeline.sound place WEEK     real-sfx picks and places the sounds over the rendered reel
    python -m pipeline.sound review WEEK    real-sfx's critique and earshot's listening review

The order for a week: prepare, render (`pipeline.video`; the reel has the song only), `sound cues`, `sound
place` (it writes output/WEEK/reel.mp4 with the effects, keeping the plain render), `sound review`; fix what the
review finds and run place and review again. Three tools, one job each:

- **Where sound goes**: the picture says it. Every move in the kit records a cue (reel/lib/kit.js R.cue: slams,
  pops, whooshes, pixelfx hits, world openings, glitch type, the CRT switching off) on the frame the eye reads it.
  `cues` builds the page in headless Chrome and writes reel/weeks/WEEK/cues.json (earshot's real-sound format).
- **Which sound, placed how**: real-sfx (.claude/skills/real-sfx, Clipwing). `place` keeps the heaviest cues
  within the density budget, turns them into real-sfx's typed events by reel/sound/design.json, and runs its
  from_cues.py and mix.py: real recordings from the Openverse library (`python -m pipeline.openverse library`),
  the earshot kit only where the library has fewer than three fitting sounds, each sound on its frame, nudged onto
  the song's beat when within 50 ms (the beat grid checked against the kick), tonal sounds tuned to the song's
  notes, the effects dipped lightly under the voice. The song is never changed: no ducking of it, no loudness
  normalisation of the mix.
- **How it measures**: real-sfx's verify and critique (sync, coverage, pacing, variety, hierarchy, balance, the
  five moments to listen to) and earshot (timeline with sync per cue, an annotated sheet, a scorecard against
  professional launch films), in output/WEEK/sound/.

earshot lives in its own folder and Python (D:/Projects/Experiments/earshot, or EARSHOT_PY); Chrome at its usual
place, or CHROME.
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

from .settings import OUTPUT_DIR, ROOT, WEEK_RE, RunError, log

REEL_DIR = ROOT / "reel"
REAL_SFX = ROOT / ".claude" / "skills" / "real-sfx"
EARSHOT_PY = Path(os.environ.get("EARSHOT_PY", ROOT.parent / "earshot" / ".venv" / "Scripts" / "python.exe"))
CHROME = Path(os.environ.get("CHROME", r"C:\Program Files\Google\Chrome\Application\chrome.exe"))
KIT_DIR = REEL_DIR / "sfx" / "kit"
FPS = 60
CUES_RE = re.compile(r'<script type="application/json" id="hf-cues">(.*?)</script>', re.S)
# earshot kit roles as real-sfx catalog types (the folder a kit take sits in decides its role there)
KIT_TYPES = {"land": "foley", "land.light": "foley", "tock": "foley", "hit": "impact", "drop": "impact", "pop": "pop",
             "whoosh.short": "whoosh", "whoosh.long": "whoosh", "riser": "riser", "swell": "riser", "tick": "click",
             "tick.crisp": "click", "click": "click", "snap": "click", "coin": "chime", "bell": "chime",
             "glitch": "glitch", "switch": "power", "zap": "scifi"}


# ---- cues from the picture
def to_cue_file(page: dict) -> dict:
    """The page's cue list in earshot's real-sound cues.json format (frames at 60 fps)."""
    events = []
    for c in sorted(page["cues"], key=lambda c: c["t"]):
        event = {"f": round(c["t"] * FPS, 2), "kind": c["kind"], "weight": c.get("weight", 1), "id": c["id"]}
        if "pan" in c:
            event["pan"] = c["pan"]
        if "dur" in c:
            event["dur"] = round(c["dur"] * FPS, 1)
        events.append(event)
    return {"fps": FPS, "bpm": page.get("bpm"), "total": round(page["duration"] * FPS), "events": events}


def from_cue_file(cue_file: dict) -> list[dict]:
    """Back from frames to seconds."""
    fps = cue_file.get("fps", FPS)
    out = []
    for e in cue_file["events"]:
        c = dict(e, t=round(e["f"] / fps, 4))
        if "dur" in e:
            c["dur"] = round(e["dur"] / fps, 4)
        out.append(c)
    return out


def read_page(index: Path = REEL_DIR / "index.html", chrome: Path = CHROME) -> dict:
    """Build the reel page in headless Chrome and read the cue list it writes after building."""
    if not chrome.exists():
        raise RunError(f"Chrome was not found at {chrome} (set CHROME)")
    profile = OUTPUT_DIR / ".chrome-cues"
    result = subprocess.run([str(chrome), "--headless=new", "--disable-gpu", "--mute-audio", "--allow-file-access-from-files",
                             "--virtual-time-budget=20000", f"--user-data-dir={profile}", "--dump-dom", index.resolve().as_uri()],
                            capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=180)
    found = CUES_RE.search(result.stdout)
    if not found:
        raise RunError("The page wrote no cue list (does reel/index.html still write #hf-cues after R.build?)")
    return json.loads(found.group(1))


def cues(week: str, reel_dir: Path = REEL_DIR, read=read_page) -> Path:
    """Write reel/weeks/WEEK/cues.json from the built page; the page must be prepared for this week."""
    if f'src="weeks/{week}/' not in (reel_dir / "index.html").read_text(encoding="utf-8"):
        raise RunError(f"reel/index.html is not prepared for {week}: run pipeline.video's prepare first")
    cue_file = to_cue_file(read(reel_dir / "index.html"))
    target = reel_dir / "weeks" / week / "cues.json"
    target.write_text(json.dumps(cue_file, indent=1) + "\n", encoding="utf-8")
    kinds = {}
    for e in cue_file["events"]:
        kinds[e["kind"]] = kinds.get(e["kind"], 0) + 1
    log(f"sound: {len(cue_file['events'])} cues -> {target.relative_to(ROOT)} ({', '.join(f'{k} {n}' for k, n in sorted(kinds.items()))})")
    return target


# ---- which cues get a sound
def crowded(times: list[float], t: float, window: float, density: int) -> bool:
    """Whether adding a sound at t puts more than `density` in some `window`-second stretch that contains t."""
    starts = [s for s in times if t - window < s <= t] + [t]
    return any(sum(1 for x in times + [t] if s <= x < s + window) > density for s in starts)


def choose(cues: list[dict], kinds: dict, density: int, window: float = 10.0, min_gap_ms: float = 90,
           quiet: list | None = None) -> tuple[list, list]:
    """The cues that get a sound: heaviest first, no two closer than min_gap_ms, at most `density` in any `window`
    seconds, none inside a `quiet` stretch ([start, end] seconds: a whispered line, a held silence). Returns (kept,
    [(cue, why)]) in time order."""
    order = sorted((c for c in cues if kinds.get(c["kind"])), key=lambda c: (-c.get("weight", 1), c["t"]))
    kept, dropped = [], []
    for c in order:
        if any(a <= c["t"] <= b for a, b in quiet or []):
            dropped.append((c, "in a quiet stretch"))
        elif any(abs(k["t"] - c["t"]) < min_gap_ms / 1000 for k in kept):
            dropped.append((c, f"another sound within {min_gap_ms:g} ms"))
        elif crowded([k["t"] for k in kept], c["t"], window, density):
            dropped.append((c, f"over {density} per {window:g} s"))
        else:
            kept.append(c)
    return sorted(kept, key=lambda c: c["t"]), sorted(dropped, key=lambda d: d[0]["t"])


def to_events(kept: list[dict], kinds: dict) -> list[dict]:
    """real-sfx typed events: kind by the design, g by the design's base times the cue's weight (square root, so a
    double-weight cue is about 3 dB up), whoosh lengths from the move."""
    events = []
    for c in kept:
        kind, base = kinds[c["kind"]]
        event = {"t": c["t"], "type": kind, "g": round(base * max(0.25, c.get("weight", 1)) ** 0.5, 3), "id": c["id"]}
        if "dur" in c and kind in ("whoosh", "wipe", "riser"):
            event["len"] = max(0.2, round(c["dur"], 3))
        if "pan" in c:
            event["pan"] = c["pan"]
        events.append(event)
    return events


def design(reel_dir: Path = REEL_DIR, week: str | None = None) -> dict:
    """The series' sound design (reel/sound/design.json) with a week's overrides (reel/weeks/WEEK/sound.json)."""
    out = json.loads((reel_dir / "sound" / "design.json").read_text(encoding="utf-8"))
    week_file = reel_dir / "weeks" / week / "sound.json" if week else None
    if week_file and week_file.exists():
        for key, value in json.loads(week_file.read_text(encoding="utf-8")).items():
            out[key] = dict(out.get(key, {}), **value) if isinstance(value, dict) and isinstance(out.get(key), dict) else value
    return out


# ---- running the tools
def _run(args: list[str], cwd: Path, timeout: int = 1800, env: dict | None = None) -> subprocess.CompletedProcess:
    full_env = dict(os.environ, PYTHONUTF8="1", PYTHONIOENCODING="utf-8", **(env or {}))
    return subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout,
                          cwd=cwd, env=full_env)


def real_sfx(script: str, args: list[str], timeout: int = 1800, verdict: bool = False) -> subprocess.CompletedProcess:
    """One of real-sfx's scripts, run from its folder with the pipeline's Python (it needs only numpy and ffmpeg).
    verdict: the script's exit code is its verdict (critique.py exits 1 below its bar), not a failure."""
    result = _run([sys.executable, f"scripts/{script}", *args], REAL_SFX, timeout)
    if result.returncode != 0 and not (verdict and result.stdout.strip()):
        raise RunError(f"real-sfx {script} failed: " + (result.stderr or result.stdout).strip()[-900:])
    return result


def earshot(args: list[str], timeout: int = 1800) -> subprocess.CompletedProcess:
    if not EARSHOT_PY.exists():
        raise RunError(f"earshot's Python was not found at {EARSHOT_PY} (install earshot beside the project, or set EARSHOT_PY)")
    result = _run([str(EARSHOT_PY), "-m", "earshot", *args], ROOT, timeout, {"EARSHOT_THREADS": os.environ.get("EARSHOT_THREADS", "3")})
    if result.returncode != 0:
        raise RunError(f"earshot {args[0]} failed: " + (result.stderr or result.stdout).strip()[-600:])
    return result


def earshot_ready() -> bool:
    """Whether earshot's Python exists and can import earshot."""
    return EARSHOT_PY.exists() and _run([str(EARSHOT_PY), "-c", "import earshot"], ROOT, 120).returncode == 0


def loudness(path: Path) -> float:
    """Integrated loudness (LUFS) of a file's audio, by FFmpeg's EBU R128 meter."""
    result = _run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-map", "0:a", "-af", "ebur128", "-f", "null", "-"], ROOT, 600)
    found = re.findall(r"^\s+I:\s+(-?[\d.]+) LUFS", result.stderr, re.M)
    if not found:
        raise RunError(f"Could not measure the loudness of {path.name}")
    return float(found[-1])


def sha1(path: Path) -> str:
    h = hashlib.sha1()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


# ---- the earshot kit as real-sfx's fallback library
def kit(reel_dir: Path = REEL_DIR) -> Path:
    """Render reel/sound/kit.json with earshot into reel/sfx/kit/<type>/, write its catalog and register it with
    real-sfx as an extra (fallback) library: used only where the Openverse library has fewer than three fitting
    sounds."""
    raw = KIT_DIR / "_render"
    earshot(["kit", "render", str(reel_dir / "sound" / "kit.json"), "--out", str(raw)])
    lock = json.loads((raw / "kit.lock.json").read_text(encoding="utf-8"))
    rows = []
    for role_name, role in lock["roles"].items():
        kind = KIT_TYPES.get(role_name)
        if not kind or not role:
            continue
        (KIT_DIR / kind).mkdir(parents=True, exist_ok=True)
        for n, take in enumerate(role["takes"]):
            name = f"{kind}/earshot-{role_name.replace('.', '-')}-{n}.wav"
            shutil.copyfile(raw / take["file"], KIT_DIR / name)
            rows.append({"file": name, "type": kind, "source": f"earshot kit {role['sound']}", "hit": n + 1, "hits_in_source": len(role["takes"])})
    (KIT_DIR / "catalog.json").write_text(json.dumps(rows, indent=1) + "\n", encoding="utf-8")
    real_sfx("setup.py", ["add-library", "earshot_kit", str(KIT_DIR), "--tier", "extra", "--index"])
    log(f"sound: earshot kit, {len(rows)} takes, registered with real-sfx as a fallback library")
    return KIT_DIR


# ---- place
def place(week: str, reel_dir: Path = REEL_DIR, output_dir: Path = OUTPUT_DIR) -> Path:
    """real-sfx places the week's sounds over the rendered reel; output/WEEK/reel.mp4 becomes the reel with them."""
    week_dir, out = reel_dir / "weeks" / week, output_dir / week / "sound"
    reel, song = output_dir / week / "reel.mp4", output_dir / week / "audio.mp3"
    for needed, how in ((week_dir / "cues.json", f"python -m pipeline.sound cues {week}"), (reel, "render the week"), (song, "the song pipeline")):
        if not needed.exists():
            raise RunError(f"{needed} is missing: {how} first")
    out.mkdir(parents=True, exist_ok=True)
    # The base is the plain render: a fresh render replaces it; the reel this step made last time never does.
    state_path, base = out / "state.json", out / "base.mp4"
    state = json.loads(state_path.read_text(encoding="utf-8")) if state_path.exists() else {}
    if not base.exists() or sha1(reel) != state.get("made"):
        shutil.copyfile(reel, base)
    d = design(reel_dir, week)
    kinds = {k: v for k, v in d["kinds"].items() if v}
    kept, dropped = choose(from_cue_file(json.loads((week_dir / "cues.json").read_text(encoding="utf-8"))), kinds, d["density"],
                           quiet=d.get("quiet"))
    events = to_events(kept, kinds)
    (out / "events.json").write_text(json.dumps(events, indent=1) + "\n", encoding="utf-8")
    (out / "dropped.json").write_text(json.dumps([dict(c, why=why) for c, why in dropped], indent=1) + "\n", encoding="utf-8")
    sheet = out / "sheet.json"
    args = [str(out / "events.json"), "--video", str(base), "--out", str(sheet), "--ui", "library", "--keep-original", "--no-retime"]
    for name, target in d.get("real_sfx_kinds", {}).items():
        args += ["--kind", f"{name}={target}"]
    if d.get("real_sfx_map"):
        (out / "map.json").write_text(json.dumps(d["real_sfx_map"], indent=1) + "\n", encoding="utf-8")
        args += ["--map", str(out / "map.json")]
    made = real_sfx("from_cues.py", args)
    pan_sheet(sheet, events)
    mix = [str(sheet), "--out", str(out / "reel_sfx.mp4"), "--no-loudnorm", "--music-ref", str(song)]
    mix += d.get("mix_flags", [])
    mixed = real_sfx("mix.py", mix)
    (out / "place.log").write_text(made.stdout + "\n----\n" + mixed.stdout, encoding="utf-8")
    # The song must come through unchanged: the effects sit over it, they never turn it down.
    before, after = loudness(base), loudness(out / "reel_sfx.mp4")
    if after < before - 0.5:
        log(f"sound: WARNING: the reel is {before - after:.1f} LU quieter than the plain render ({after:.1f} vs {before:.1f} LUFS): "
            "an effect's peak made the mixer's -1 dBTP guard turn the whole mix down. Lower the loudest effects in "
            "reel/sound/design.json and place again.")
    shutil.copyfile(out / "reel_sfx.mp4", reel)
    state_path.write_text(json.dumps({"made": sha1(reel)}) + "\n", encoding="utf-8")
    voiced = re.search(r"declared \d+ events: .*", made.stdout)
    log(f"sound: {len(events)} of {len(events) + len(dropped)} cues get a sound ({voiced.group(0) if voiced else 'see place.log'}); "
        f"{reel.relative_to(ROOT)} now has the effects, the plain render is {base.relative_to(ROOT)}")
    return reel


def pan_sheet(sheet: Path, events: list[dict]) -> int:
    """Carry the picture's pans (a side-throw moves left or right) onto real-sfx's cue sheet, which from_cues.py
    does not copy: the cue at the same time (within 5 ms) gets the event's pan. Returns how many were panned."""
    data = json.loads(sheet.read_text(encoding="utf-8"))
    panned = 0
    for cue in data["cues"]:
        match = next((e for e in events if "pan" in e and abs(e["t"] - cue.get("t", -1)) < 0.005), None)
        if match:
            cue["pan"] = match["pan"]
            panned += 1
    sheet.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    return panned


# ---- review
def review(week: str, output_dir: Path = OUTPUT_DIR, reel_dir: Path = REEL_DIR) -> Path:
    """real-sfx's verify and critique of the placed sounds, and earshot's timeline, sheet and critique of the reel."""
    out = output_dir / week / "sound"
    resolved, track = out / "reel_sfx_resolved_cues.json", out / "reel_sfx_sfx_track.wav"
    if not resolved.exists():
        raise RunError(f"No placed sounds for {week}: run `python -m pipeline.sound place {week}` first")
    reel, cue_path = output_dir / week / "reel.mp4", reel_dir / "weeks" / week / "cues.json"
    verify = real_sfx("verify.py", [str(resolved), str(track)], verdict=True)
    (out / "verify_real_sfx.txt").write_text(verify.stdout, encoding="utf-8")
    critique = real_sfx("critique.py", [str(resolved), str(track), "--out", str(out / "critique_real_sfx.md"),
                                        "--listen-out", str(out / "listen.wav")], verdict=True)
    (out / "critique_real_sfx.txt").write_text(critique.stdout, encoding="utf-8")
    notes = []
    if earshot_ready():
        for name, args in (("timeline", ["timeline", str(reel), "--cues", str(cue_path)]),
                           ("sheet", ["sheet", str(reel), "-o", str(out / "earshot_sheet.png"), "--cues", str(cue_path)]),
                           ("critique", ["critique", str(reel)])):
            (out / f"earshot_{name}.txt").write_text(earshot(args).stdout, encoding="utf-8")
    else:
        notes.append("earshot is not installed (or not finished installing), so its listening review was skipped")
    log(f"sound: review of {week} in {out.relative_to(ROOT)}" + (f" ({'; '.join(notes)})" if notes else ""))
    return out


def main() -> int:
    args = sys.argv[1:]
    try:
        if args == ["kit"]:
            kit()
            return 0
        if len(args) == 2 and args[0] in ("cues", "place", "review") and WEEK_RE.match(args[1]):
            {"cues": cues, "place": place, "review": review}[args[0]](args[1])
            return 0
    except RunError as exc:
        log(f"sound: FAILED: {exc}")
        return 1
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main())
