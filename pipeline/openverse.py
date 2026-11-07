"""Find and fetch real sound recordings from Openverse (openverse.org) for a week's sound design.

    python -m pipeline.openverse search "coin drop" [--long]   list recordings (id, licence, length, title)
    python -m pipeline.openverse get NAME ID                    download one into reel/sfx/openverse/NAME.wav
    python -m pipeline.openverse library                        fill the series' sound library from reel/sound/library.json

The library is what real-sfx (.claude/skills/real-sfx) picks the reel's sounds from: one-shots per type in
reel/sfx/library/<type>/, with the catalog.json real-sfx reads (file, type, source, hit, hits_in_source), so it
knows what each sound is instead of guessing from file names. Running it again only fetches what is missing.

Only CC0, public-domain and CC BY recordings are listed or fetched (earshot's real-sound policy: no NC, ND or
SA). Every download is converted to 48 kHz WAV, and its attribution is written to reel/sound/openverse.json
(tracked; the audio itself stays out of git like the rest of reel/sfx/), so the description can credit CC BY. Searches are short
sounds (under 30 s) unless --long is given. Openverse's own category filter drops most results, so it is not
used.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from .settings import ROOT, RunError, log

API = "https://api.openverse.org/v1/audio/"
AGENT = "Mu-Zueki/1.0 (weekly finance reel; sound design)"
SFX_DIR = ROOT / "reel" / "sfx" / "openverse"
LIBRARY_DIR = ROOT / "reel" / "sfx" / "library"
PLAN = ROOT / "reel" / "sound" / "library.json"
CREDITS = ROOT / "reel" / "sound" / "openverse.json"
ALLOWED = {"cc0", "pdm", "by"}


def _get(url: str, timeout: int = 60) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": AGENT})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        raise RunError(f"Openverse answered {exc.code} for {url}") from exc
    except OSError as exc:
        raise RunError(f"Openverse could not be reached: {exc}") from exc


def allowed(record: dict) -> bool:
    return record.get("license") in ALLOWED


def search(query: str, long: bool = False, pages: int = 1) -> list[dict]:
    """Recordings for a query, licence-filtered, short ones first unless `long`."""
    found = []
    for page in range(1, pages + 1):
        params = {"q": query, "license": ",".join(sorted(ALLOWED)), "page_size": 20, "page": page}
        if not long:
            params["length"] = "shortest,short"
        data = json.loads(_get(API + "?" + urllib.parse.urlencode(params)))
        found += [r for r in data.get("results", []) if allowed(r)]
        if page >= data.get("page_count", 0):
            break
    return found


def credit(record: dict) -> dict:
    """What the reel's description and credits need about one recording."""
    return {
        "id": record["id"],
        "title": record.get("title"),
        "creator": record.get("creator"),
        "source": record.get("source"),
        "license": record["license"],
        "license_version": record.get("license_version"),
        "license_url": record.get("license_url"),
        "page": record.get("foreign_landing_url"),
        "attribution": record.get("attribution"),
        "needs_credit": record["license"] == "by",
    }


def convert(source: Path, target: Path) -> None:
    """Any audio file as 48 kHz 16-bit WAV, mono kept mono, with a 10 ms fade at its end: previews are often cut
    mid-sound, and a sound that stops at full level clicks wherever it is placed."""
    result = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(source), "-af", "areverse,afade=t=in:d=0.01,areverse",
                             "-ar", "48000", "-c:a", "pcm_s16le", str(target)],
                            capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=300)
    if result.returncode != 0 or not target.exists():
        raise RunError(f"Could not convert {source.name}: {result.stderr.strip()[-300:]}")


def get(name: str, record_id: str, sfx_dir: Path = SFX_DIR, credits_path: Path = CREDITS, fetch=_get, to_wav=convert) -> dict:
    """Download one recording as sfx/openverse/NAME.wav and record its credit."""
    if not re.fullmatch(r"[a-z0-9][a-z0-9_-]*", name):
        raise RunError(f"{name!r} is not a usable name (lower case, digits, - and _)")
    record = json.loads(fetch(API + urllib.parse.quote(record_id) + "/"))
    if not allowed(record):
        raise RunError(f"{record_id} is {record.get('license')} {record.get('license_version')}: only CC0, PDM and CC BY are used")
    sfx_dir.mkdir(parents=True, exist_ok=True)
    raw = sfx_dir / f"{name}.download{Path(urllib.parse.urlparse(record['url']).path).suffix or '.mp3'}"
    raw.write_bytes(fetch(record["url"], timeout=180))
    to_wav(raw, sfx_dir / f"{name}.wav")
    raw.unlink()
    credits_path.parent.mkdir(parents=True, exist_ok=True)
    credits = json.loads(credits_path.read_text(encoding="utf-8")) if credits_path.exists() else {}
    credits[name] = credit(record)
    credits_path.write_text(json.dumps(credits, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    log(f"openverse: saved {(sfx_dir / name).relative_to(ROOT).as_posix() if sfx_dir.is_relative_to(ROOT) else name}.wav ({record.get('title')}, {record['license']} {record.get('license_version')})")
    return credits[name]


def library(plan_path: Path = PLAN, library_dir: Path = LIBRARY_DIR, credits_path: Path = CREDITS,
            find=search, fetch=_get, to_wav=convert, pause: float = 1.5) -> list[dict]:
    """Fill the library from the plan: for each type, its searches in order, the first `count` recordings whose
    length fits, one per Openverse id; then write catalog.json over everything in the folder."""
    import time
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    credits = json.loads(credits_path.read_text(encoding="utf-8")) if credits_path.exists() else {}
    have = {c["id"] for c in credits.values()}
    for kind, spec in plan["types"].items():
        folder = library_dir / kind
        taken = len(list(folder.glob("*.wav"))) if folder.exists() else 0
        low, high = spec.get("seconds", plan.get("seconds", [0.1, 4.0]))
        for query in spec["queries"]:
            if taken >= spec["count"]:
                break
            for record in find(query):
                seconds = (record.get("duration") or 0) / 1000
                if taken >= spec["count"] or record["id"] in have or not low <= seconds <= high:
                    continue
                slug = re.sub(r"[^a-z0-9]+", "-", (record.get("title") or "sound").lower()).strip("-")[:40] or "sound"
                name = f"{kind}-{slug}-{record['id'][:8]}"
                get(name, record["id"], folder, credits_path, fetch=fetch, to_wav=to_wav)
                have.add(record["id"])
                taken += 1
                time.sleep(pause)
    credits = json.loads(credits_path.read_text(encoding="utf-8")) if credits_path.exists() else {}
    rows = []
    for wav in sorted(library_dir.glob("*/*.wav")):
        entry = credits.get(wav.stem, {})
        rows.append({"file": wav.relative_to(library_dir).as_posix(), "type": wav.parent.name,
                     "source": entry.get("page") or wav.stem, "hit": 1, "hits_in_source": 1})
    library_dir.mkdir(parents=True, exist_ok=True)
    (library_dir / "catalog.json").write_text(json.dumps(rows, indent=1) + "\n", encoding="utf-8")
    log(f"openverse: library has {len(rows)} sounds in {len({r['type'] for r in rows})} types -> {library_dir / 'catalog.json'}")
    return rows


def main() -> int:
    args = sys.argv[1:]
    try:
        if len(args) >= 2 and args[0] == "search":
            long = "--long" in args
            query = " ".join(a for a in args[1:] if a != "--long")
            for r in search(query, long):
                seconds = (r.get("duration") or 0) / 1000
                print(f"{r['id']} | {r['license']} {r.get('license_version')} | {seconds:5.1f} s | {r.get('source')} | {r.get('title')}")
            return 0
        if len(args) == 3 and args[0] == "get":
            get(args[1], args[2])
            return 0
        if args == ["library"]:
            library()
            return 0
    except RunError as exc:
        log(f"openverse: FAILED: {exc}")
        return 1
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main())
