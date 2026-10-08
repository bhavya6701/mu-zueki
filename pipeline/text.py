"""Small text helpers used by several stages: tokens, plan lyrics, SRT."""
from __future__ import annotations

import re

LABEL_RE = re.compile(r"\[[^\]]*\]")


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower().replace("'", "").replace("’", ""))


def lyric_lines(chunk_text: str) -> list[str]:
    """The sung lines of a plan chunk: the section label, {cues} and (ad-libs) removed."""
    lines = []
    for line in chunk_text.splitlines():
        line = re.sub(r"\{[^}]*\}|\([^)]*\)", " ", line).strip()
        if line and not LABEL_RE.fullmatch(line):
            lines.append(line)
    return lines


def lyric_tokens(chunk_text: str) -> list[str]:
    return [tok for line in lyric_lines(chunk_text) for tok in tokenize(line)]


def srt_time(seconds: float) -> str:
    ms = max(0, round(seconds * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def render_srt(captions: list[dict]) -> str:
    return "\n".join(
        f"{i}\n{srt_time(c['start'])} --> {srt_time(c['end'])}\n{c['text']}\n" for i, c in enumerate(captions, 1)
    )
