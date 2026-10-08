"""Listen to a generated take: what was actually sung, when, and how well it matches the lyrics.

Whisper hears the real audio. The word timestamps ElevenLabs returns are planned positions, not
what was sung, so nothing here uses them.
"""
from __future__ import annotations

import difflib
from pathlib import Path

from .text import tokenize

WHISPER_MODEL = "small.en"
MIN_CAPTION_SECONDS = 0.3

Word = tuple[str, float, float]  # token, start seconds, end seconds

_models: dict = {}


def transcribe(audio: Path, model_name: str = WHISPER_MODEL) -> list[Word]:
    from faster_whisper import WhisperModel

    if model_name not in _models:
        _models[model_name] = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, _ = _models[model_name].transcribe(str(audio), language="en", word_timestamps=True, vad_filter=False)
    words = []
    for segment in segments:
        for w in segment.words or []:
            # One transcript word can hold several tokens ("mew-zookie"); they share its timing.
            for tok in tokenize(w.word):
                words.append((tok, float(w.start), float(w.end)))
    return words


def match(expected: list[str], words: list[Word]) -> list[int | None]:
    """For each expected lyric token, the index of the heard word it matched, or None."""
    matched: list[int | None] = [None] * len(expected)
    blocks = difflib.SequenceMatcher(None, expected, [w[0] for w in words], autojunk=False).get_matching_blocks()
    for block in blocks:
        for k in range(block.size):
            matched[block.a + k] = block.b + k
    return matched


def coverage(matched: list[int | None]) -> float:
    return sum(m is not None for m in matched) / len(matched) if matched else 0.0


def vocal_onset(matched: list[int | None], words: list[Word], max_gap: float = 1.0) -> float | None:
    """When the lyrics start being sung.

    Starts from the first heard word that matches the lyrics, then steps back over any words heard
    just before it (opening words Whisper got wrong), so a trim never cuts into the vocal. Stray
    sounds heard seconds earlier are not counted.
    """
    first = next((m for m in matched if m is not None), None)
    if first is None:
        return None
    while first > 0 and words[first][1] - words[first - 1][2] < max_gap:
        first -= 1
    return words[first][1]


def align(captions: list[dict], words: list[Word]) -> tuple[list[dict], list[int]]:
    """Time each caption from its matched sung words.

    Returns (captions with start/end added, 1-based numbers of captions whose timing was interpolated).
    """
    tokens: list[str] = []
    owner: list[int] = []
    for i, cap in enumerate(captions):
        toks = tokenize(cap["sung"])
        tokens += toks
        owner += [i] * len(toks)

    spans: list[list[float] | None] = [None] * len(captions)
    for tok_index, word_index in enumerate(match(tokens, words)):
        if word_index is None:
            continue
        i = owner[tok_index]
        _, start, end = words[word_index]
        if spans[i] is None:
            spans[i] = [start, end]
        else:
            spans[i][1] = end

    interpolated = [i + 1 for i, s in enumerate(spans) if s is None]
    audio_end = words[-1][2] if words else 0.0
    i = 0
    while i < len(spans):  # fill each run of unmatched captions evenly between its matched neighbours
        if spans[i] is not None:
            i += 1
            continue
        j = i
        while j < len(spans) and spans[j] is None:
            j += 1
        left = spans[i - 1][1] if i > 0 else 0.0
        right = spans[j][0] if j < len(spans) else max(audio_end, left)
        step = max(right - left, 0.0) / (j - i)
        for k in range(i, j):
            spans[k] = [left + step * (k - i), left + step * (k - i + 1)]
        i = j

    result = [{**cap, "start": round(span[0], 3), "end": round(span[1], 3)} for cap, span in zip(captions, spans)]
    for k, cap in enumerate(result):
        if k + 1 < len(result):
            cap["end"] = min(cap["end"], result[k + 1]["start"])
        if cap["end"] - cap["start"] < MIN_CAPTION_SECONDS:
            cap["end"] = round(cap["start"] + MIN_CAPTION_SECONDS, 3)
            if k + 1 < len(result):
                result[k + 1]["start"] = max(result[k + 1]["start"], cap["end"])
    return result, interpolated


def display_words(caption: dict, words: list[Word]) -> list[dict]:
    """Timings for the words shown on screen ("S&P", "7,800"), which differ from the words sung
    ("S and P", "seventy-eight hundred") and from the words heard ("smp", "7800").

    Works inside one timed caption: sung tokens take the time of the heard word they match, or are
    spread evenly between their matched neighbours; each display word then spans the sung tokens it
    stands for. Returns [{"text", "start", "end"}], in order, without overlaps.
    """
    start, end = caption["start"], caption["end"]
    shown = caption["text"].split()
    if not shown:
        return []
    sung = tokenize(caption["sung"]) or ["_"]
    inside = [w for w in words if w[2] > start - 0.05 and w[1] < end + 0.05]

    # A start time for every sung token, plus the caption end as the final boundary.
    matched = match(sung, inside)
    known = {-1: start, len(sung): end}
    known.update({i: min(max(inside[m][1], start), end) for i, m in enumerate(matched) if m is not None})
    known[0] = known.get(0, start) if matched[0] is not None else start
    anchors = sorted(known)
    times = []
    for i in range(len(sung) + 1):
        left = max(a for a in anchors if a <= i)
        right = min(a for a in anchors if a >= i)
        share = 0.0 if right == left else (i - left) / (right - left)
        times.append(known[left] + (known[right] - known[left]) * share)
    times = [max(t, times[k - 1]) if k else t for k, t in enumerate(times)]

    # Which sung token each display word begins at: exact token matches anchor, the rest are spread.
    display_tokens: list[str] = []
    owner: list[int] = []
    for n, word in enumerate(shown):
        for tok in tokenize(word) or ["_"]:
            display_tokens.append(tok)
            owner.append(n)
    pairs = {0: 0, len(display_tokens): len(sung)}
    for block in difflib.SequenceMatcher(None, display_tokens, sung, autojunk=False).get_matching_blocks():
        for k in range(block.size):
            pairs[block.a + k] = block.b + k
    marks = sorted(pairs)

    def sung_index(d: int) -> float:
        left = max(m for m in marks if m <= d)
        right = min(m for m in marks if m >= d)
        share = 0.0 if right == left else (d - left) / (right - left)
        return pairs[left] + (pairs[right] - pairs[left]) * share

    def time_at(position: float) -> float:
        low = min(int(position), len(sung) - 1)
        return times[low] + (times[low + 1] - times[low]) * (position - low)

    first_token = [owner.index(n) for n in range(len(shown))]
    starts = [time_at(sung_index(d)) for d in first_token] + [end]
    return [
        {"text": word, "start": round(starts[n], 3), "end": round(max(starts[n + 1], starts[n]), 3)}
        for n, word in enumerate(shown)
    ]


# ---------------------------------------------------------------- audio file helpers (PyAV)

def read_audio(path: Path):
    """(samples as int16 array of shape (2, n), sample rate)."""
    import av
    import numpy as np

    with av.open(str(path)) as container:
        stream = container.streams.audio[0]
        rate = stream.rate
        resampler = av.AudioResampler(format="s16p", layout="stereo", rate=rate)
        blocks = [out.to_ndarray() for frame in container.decode(stream) for out in resampler.resample(frame)]
    return np.concatenate(blocks, axis=1), rate


def write_mp3(path: Path, samples, rate: int, bit_rate: int = 128000) -> None:
    import av

    with av.open(str(path), "w", format="mp3") as container:
        stream = container.add_stream("libmp3lame", rate=rate)
        stream.bit_rate = bit_rate
        stream.layout = "stereo"
        step = 1152
        for start in range(0, samples.shape[1], step):
            frame = av.AudioFrame.from_ndarray(samples[:, start:start + step].copy(), format="s16p", layout="stereo")
            frame.sample_rate = rate
            frame.pts = start
            for packet in stream.encode(frame):
                container.mux(packet)
        for packet in stream.encode(None):
            container.mux(packet)


def duration(path: Path) -> float:
    samples, rate = read_audio(path)
    return samples.shape[1] / rate


def trim_start(src: Path, dst: Path, seconds: float, fade: float = 0.02) -> float:
    """Cut `seconds` off the start with a short fade-in. Returns the new duration."""
    import numpy as np

    samples, rate = read_audio(src)
    cut = samples[:, int(seconds * rate):].astype("float32")
    n = min(int(fade * rate), cut.shape[1])
    if n:
        cut[:, :n] *= np.linspace(0.0, 1.0, n, dtype="float32")
    write_mp3(dst, cut.astype("int16"), rate)
    return cut.shape[1] / rate
