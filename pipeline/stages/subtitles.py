"""Stage 3: time the captions from what was actually sung, and write the timeline the video is built on."""
from __future__ import annotations

from .. import beats, listen
from ..episode import DONE, REVIEW, Episode, StageResult
from ..settings import log
from ..text import render_srt

NAME = "subtitles"
MAX_INTERPOLATED_SHARE = 0.25


def audio_analysis(episode: Episode, bpm: int, sections: list[dict]) -> tuple[dict, list]:
    """(beat grid, loudness and bass of each section), measured from the finished audio."""
    samples, rate = listen.read_audio(episode.audio_mp3)
    mono = samples.astype("float32").mean(axis=0) / 32768
    grid = beats.find_beats(mono, rate, bpm)
    energy = beats.section_energy(mono, rate, [(s["start"], s["end"]) for s in sections])
    return grid, energy


def run(episode: Episode, settings: dict, analyse=audio_analysis) -> StageResult:
    song = episode.read_json(episode.song_json)
    audio = episode.read_json(episode.audio_json)
    words = [tuple(w) for w in audio["words"]]
    captions, interpolated = listen.align(song["captions"], words)
    episode.write_text(episode.subtitles_srt, render_srt(captions))

    sections = []
    for n, chunk in enumerate(song["plan"]["chunks"], 1):
        own = [c for c in captions if c["section"] == n]
        sections.append({
            "index": n,
            "label": chunk["text"].splitlines()[0].strip(),
            "start": own[0]["start"] if own else None,
            "end": own[-1]["end"] if own else None,
            "styles": chunk["positive_styles"],
        })
    grid, energy = analyse(episode, song["bpm"], sections)
    for section, level in zip(sections, energy):
        section["energy"] = level

    episode.write_json(episode.timeline_json, {
        "episode": episode.week,
        "audio": episode.audio_mp3.name,
        "duration_seconds": audio["duration_seconds"],
        "bpm": grid["bpm"],
        "seconds_per_beat": round(60 / grid["bpm"], 4),
        "seconds_per_bar": round(240 / grid["bpm"], 4),
        "beats": grid["beats"],
        "downbeats": grid["downbeats"],
        "mood": song["mood"]["name"],
        "sections": sections,
        "captions": [
            {"index": i, "section": c["section"], "start": c["start"], "end": c["end"], "text": c["text"],
             "timing": "estimated" if i in interpolated else "heard",
             "words": listen.display_words(c, words)}
            for i, c in enumerate(captions, 1)
        ],
        "reel_notes": song["reel_notes"],
    })

    log(f"subtitles: {len(captions) - len(interpolated)} of {len(captions)} captions timed from the audio; "
        f"{len(grid['beats'])} beats at {grid['bpm']} BPM")
    if len(interpolated) > MAX_INTERPOLATED_SHARE * len(captions):
        return StageResult(REVIEW, [
            f"{len(interpolated)} of {len(captions)} captions could not be heard and have estimated timing: "
            + ", ".join(map(str, interpolated))
        ])
    notes = [f"captions with estimated timing: {', '.join(map(str, interpolated))}"] if interpolated else []
    return StageResult(DONE, notes)
