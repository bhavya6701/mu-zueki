"""Find the beat grid of a generated song, so visuals can cut and pulse on the beat.

The song was generated at a known tempo, so this does not guess the tempo from nothing: it searches
close to the stated BPM for the tempo and offset whose evenly spaced beats line up best with the
moments where the sound gets louder (onsets), then picks which beat is the first of each bar from
where the bass hits hardest.
"""
from __future__ import annotations

import numpy as np

HOP = 512
WINDOW = 1024
BASS_HZ = 150
BEATS_PER_BAR = 4


def onset_envelopes(mono: np.ndarray, rate: int) -> tuple[np.ndarray, np.ndarray, float]:
    """(onset strength over time, the same for the bass band only, envelope frames per second)."""
    count = 1 + max(0, (len(mono) - WINDOW) // HOP)
    index = np.arange(WINDOW)[None, :] + HOP * np.arange(count)[:, None]
    spectrum = np.abs(np.fft.rfft(mono[index] * np.hanning(WINDOW), axis=1))
    rise = np.maximum(np.diff(np.log1p(spectrum), axis=0, prepend=0.0), 0.0)
    bass_bins = max(2, int(BASS_HZ * WINDOW / rate))
    return rise.sum(axis=1), rise[:, :bass_bins].sum(axis=1), rate / HOP


def _comb_score(envelope: np.ndarray, period: float, offset: float) -> float:
    positions = np.arange(offset, len(envelope) - 1, period)
    low = positions.astype(int)
    frac = positions - low
    return float((envelope[low] * (1 - frac) + envelope[low + 1] * frac).mean()) if len(positions) else 0.0


def find_beats(mono: np.ndarray, rate: int, bpm_hint: float, tolerance: float = 0.06) -> dict:
    """{"bpm", "beats", "downbeats"} with times in seconds. `mono` is a float array of samples."""
    duration = len(mono) / rate
    onset, bass, env_rate = onset_envelopes(mono, rate)
    onset = onset - onset.mean()

    best = (-np.inf, float(bpm_hint), 0.0)
    for bpm in np.arange(bpm_hint * (1 - tolerance), bpm_hint * (1 + tolerance) + 0.05, 0.1):
        period = env_rate * 60.0 / bpm
        for offset in np.arange(0.0, period, 1.0):
            score = _comb_score(onset, period, offset)
            if score > best[0]:
                best = (score, float(bpm), float(offset))
    _, bpm, offset = best
    period = env_rate * 60.0 / bpm

    # Refine the offset to a fraction of an envelope frame.
    fine = max(np.arange(offset - 1, offset + 1, 0.1), key=lambda o: _comb_score(onset, period, max(o, 0.0)))
    first = (max(fine, 0.0) + WINDOW / (2 * HOP)) / env_rate  # centre of the analysis window
    spacing = 60.0 / bpm
    first -= spacing * np.floor(first / spacing)  # the earliest beat at or after 0
    beats = np.arange(first, duration, spacing)

    # The first beat of the bar is where the bass (kick and 808) lands hardest.
    frames = np.clip((beats * env_rate - WINDOW / (2 * HOP)).round().astype(int), 0, len(bass) - 1)
    strength = np.array([bass[max(f - 1, 0):f + 2].max() for f in frames])
    phase = int(np.argmax([strength[p::BEATS_PER_BAR].mean() for p in range(min(BEATS_PER_BAR, len(beats)))]))
    return {
        "bpm": round(bpm, 2),
        "beats": [round(float(b), 3) for b in beats],
        "downbeats": [round(float(b), 3) for b in beats[phase::BEATS_PER_BAR]],
    }


def section_energy(mono: np.ndarray, rate: int, sections: list[tuple[float | None, float | None]]) -> list[dict | None]:
    """Loudness and bass weight of each (start, end) section, each scaled 0 to 1 against the loudest section."""
    raw = []
    for start, end in sections:
        part = mono[int(start * rate):int(end * rate)] if start is not None and end is not None else mono[:0]
        if len(part) < WINDOW:
            raw.append(None)
            continue
        power = np.abs(np.fft.rfft(part)) ** 2
        freqs = np.fft.rfftfreq(len(part), 1 / rate)
        raw.append((float(np.sqrt((part ** 2).mean())), float(power[freqs < BASS_HZ].sum() / max(power.sum(), 1e-12))))
    loudest = max((r[0] for r in raw if r), default=1.0) or 1.0
    return [None if r is None else {"loudness": round(r[0] / loudest, 2), "bass": round(r[1], 2)} for r in raw]
