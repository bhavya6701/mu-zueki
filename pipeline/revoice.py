"""Give a finished song a different voice without touching its music: python -m pipeline.revoice DATE VOICE_ID

The day's audio.mp3 is split into vocals and instrumental (ElevenLabs stem separation), the vocal alone is
converted to the chosen voice (ElevenLabs voice changer, which keeps the timing and delivery), lowered and
compressed, and mixed back over the untouched instrumental. Word timings do not move, so the subtitles
and timeline stay valid. Working files are kept in output/DATE/revoice/.

    --voices            list the account's voices (id, name, labels) and stop
    --semitones N       lower the new vocal by N semitones after conversion (default 0)
    --formant           lower the voice's body (formants) with the pitch; without it only the pitch moves
    --direct            skip the voice changer: only lower and compress the original vocal
    --gain DB           level of the new vocal against the instrumental (default 0)
    --out NAME          write output/DATE/revoice/NAME.mp3 instead of replacing audio.mp3

Both ElevenLabs steps spend credits. The split is done once and reused.
"""
from __future__ import annotations

import argparse
import io
import json
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
import uuid
import zipfile
from pathlib import Path

from . import elevenlabs
from .day import Day
from .settings import OUTPUT_DIR, RunError, log

STEMS_URL = "https://api.elevenlabs.io/v1/music/stem-separation?output_format=mp3_44100_128"
VOICE_URL = "https://api.elevenlabs.io/v1/speech-to-speech/{voice}?output_format=mp3_44100_128"
VOICES_URL = "https://api.elevenlabs.io/v1/voices"
STS_MODEL = "eleven_multilingual_sts_v2"
# The compressed, close, up-front rap vocal: body added low, mud cut, hard compression twice, then a limiter.
VOCAL_CHAIN = ("highpass=f=70,equalizer=f=160:t=q:w=1:g=3,equalizer=f=350:t=q:w=1.2:g=-2,equalizer=f=3200:t=q:w=1:g=2.5,"
               "acompressor=threshold=-24dB:ratio=6:attack=4:release=90:makeup=5,"
               "acompressor=threshold=-14dB:ratio=3:attack=12:release=160:makeup=2,alimiter=limit=0.9")


def multipart(fields: dict, files: dict) -> tuple[bytes, str]:
    """A multipart/form-data body: fields are text, files are name -> (file name, bytes, content type)."""
    boundary = uuid.uuid4().hex
    out = io.BytesIO()
    for name, value in fields.items():
        out.write(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    for name, (filename, data, kind) in files.items():
        out.write(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'
                  f"Content-Type: {kind}\r\n\r\n".encode())
        out.write(data)
        out.write(b"\r\n")
    out.write(f"--{boundary}--\r\n".encode())
    return out.getvalue(), f"multipart/form-data; boundary={boundary}"


def call(url: str, api_key: str, fields: dict | None = None, files: dict | None = None, timeout: int = 600) -> bytes:
    headers = {"xi-api-key": api_key}
    body = None
    if files:
        body, headers["Content-Type"] = multipart(fields or {}, files)
    request = urllib.request.Request(url, data=body, headers=headers, method="POST" if body else "GET")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        raise RunError(f"ElevenLabs answered {exc.code}: {exc.read().decode('utf-8', 'replace')[:400]}") from exc
    except (OSError, TimeoutError) as exc:
        raise RunError(f"ElevenLabs could not be reached: {exc}") from exc


def ffmpeg(*args: str) -> None:
    done = subprocess.run(["ffmpeg", "-v", "error", "-y", *args], capture_output=True, text=True)
    if done.returncode:
        raise RunError("ffmpeg failed: " + done.stderr.strip()[-400:])


def split(source: Path, work: Path, api_key: str) -> tuple[Path, Path]:
    """vocals.mp3 and instrumental.mp3 in the work folder; asked of ElevenLabs only the first time."""
    vocals, music = work / "vocals.mp3", work / "instrumental.mp3"
    if vocals.exists() and music.exists():
        return vocals, music
    log("revoice: splitting the song into vocals and instrumental (spends credits)")
    archive = call(STEMS_URL, api_key, {"stem_variation_id": "two_stems_v1"}, {"file": (source.name, source.read_bytes(), "audio/mpeg")})
    with zipfile.ZipFile(io.BytesIO(archive)) as stems:
        names = stems.namelist()
        voice = next((n for n in names if "vocal" in n.lower()), None)
        rest = next((n for n in names if n != voice), None)
        if not voice or not rest:
            raise RunError(f"The stem archive did not hold a vocal and an instrumental: {names}")
        vocals.write_bytes(stems.read(voice))
        music.write_bytes(stems.read(rest))
    return vocals, music


def main() -> int:
    parser = argparse.ArgumentParser(prog="pipeline.revoice", description=__doc__.split("\n")[0])
    parser.add_argument("date", nargs="?")
    parser.add_argument("voice", nargs="?")
    parser.add_argument("--voices", action="store_true")
    parser.add_argument("--semitones", type=float, default=0)
    parser.add_argument("--formant", action="store_true")
    parser.add_argument("--direct", action="store_true")
    parser.add_argument("--gain", type=float, default=0)
    parser.add_argument("--out")
    args = parser.parse_args()
    if sys.stdout is not None and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    try:
        api_key = elevenlabs.load_api_key()
        if not api_key:
            raise RunError("No ElevenLabs API key found. Put ELEVENLABS_API_KEY=your-key in config\\.env")
        if args.voices:
            for voice in json.loads(call(VOICES_URL, api_key))["voices"]:
                print(voice["voice_id"], "|", voice["name"], "|", voice.get("category"), "|", json.dumps(voice.get("labels") or {}))
            return 0
        if not args.date or not (args.voice or args.direct):
            raise RunError("Give a date and a voice id (or --direct). --voices lists the voices.")
        day = Day(OUTPUT_DIR, args.date)
        work = day.dir / "revoice"
        work.mkdir(parents=True, exist_ok=True)
        original = work / "original.mp3"
        if not original.exists():
            shutil.copyfile(day.audio_mp3, original)  # the split always starts from the first voice
        vocals, music = split(original, work, api_key)
        if args.direct:
            new = vocals
        else:
            new = work / f"voice_{args.voice}.mp3"
            if not new.exists():
                log("revoice: converting the vocal to the new voice (spends credits)")
                new.write_bytes(call(VOICE_URL.format(voice=args.voice), api_key, {"model_id": STS_MODEL},
                                     {"audio": (vocals.name, vocals.read_bytes(), "audio/mpeg")}))
        chain = VOCAL_CHAIN
        if args.semitones:
            ratio = 2 ** (-abs(args.semitones) / 12)
            chain = f"rubberband=pitch={ratio:.5f}:formant={'shifted' if args.formant else 'preserved'}:pitchq=quality," + chain
        target = work / f"{args.out}.mp3" if args.out else day.audio_mp3
        seconds = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(original)],
                                 capture_output=True, text=True).stdout.strip()
        ffmpeg("-i", str(music), "-i", str(new), "-filter_complex",
               f"[1:a]{chain},volume={args.gain}dB,apad[v];[0:a][v]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.97[m]",
               "-map", "[m]", "-t", seconds, "-c:a", "libmp3lame", "-b:a", "192k", str(target))
        log(f"revoice: wrote {target}")
        return 0
    except RunError as exc:
        log(f"FAILED: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
