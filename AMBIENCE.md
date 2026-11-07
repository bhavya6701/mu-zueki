# Ambience: making the song sound recorded in a place

ElevenLabs gives a perfect "dry" song: a voice with no room around it and digital silence between the
lines. The ambience step puts the song in the place the video shows, so the reel feels recorded on
location and the voice stops sounding generated. It runs after the song is accepted and **before any
video work**, because the place is chosen once and the song, the ambience and the pictures all share it.

The step is `pipeline/ambience.py`. Everything is done with FFmpeg; no audio editor is opened.

```
.venv\Scripts\python.exe -m pipeline.ambience WEEK --space rain
.venv\Scripts\python.exe -m pipeline.ambience WEEK --space carpark --amount 0.7 --out trial
.venv\Scripts\python.exe -m pipeline.ambience WEEK --space street --bed sfx --prompt "quiet city street at night, distant traffic"
```

## The rule above the others: less than you think

The user's instruction (2026-10-14): the ambience should be that of a studio or a genuine place, **never
so much that it affects the song**; it should make the song sound real and must not make the voice sound
artificial. So:

- The place is felt in the gaps between lines, not heard over the words. If a listener would notice
  "an effect", it is too much: lower `--amount`.
- The music is not treated at all. Only the voice gets the room, and only the bed is added.
- The default space is `studio`. Use a real place only when the song and the video are set in one.
- The step re-runs the listening check. If the words heard drop by more than 10 points it says so and
  exits with code 2: run it again with a lower `--amount`.

## What the step does, and where each guideline went

| Guideline | In this project |
|-----------|-----------------|
| **1. The space (reverb).** A dry voice has no reflections; simulate how sound bounces off the surfaces around it. | The song is split into vocal and instrumental (ElevenLabs stem separation, once per week). The vocal alone is convolved with a room impulse built for the space (`rt`, the ring time) and that "wet" copy is mixed under the dry voice at a measured level (`wet`), after a short gap (`pre`). |
| Car park, concrete: hard reflections, long decay, 1.5 to 2.5 seconds. | `carpark`: 1.9 s ring at 17 dB under the voice, 28 ms gap. `hall` is the softer large room (1.3 s). |
| Outdoors: almost no echo; a slapback of 20 to 40 ms with low feedback; mostly dry. | `outdoor`, `street`, `rain`: one echo at 32 to 36 ms, 19 to 20 dB down, a few milliseconds apart on the two sides, plus a 0.15 to 0.25 s ring that is barely there. |
| **2. The texture (room tone).** A voice that cuts to absolute silence breaks the illusion; run a continuous bed under the whole scene. | A bed runs from the first sample to the last, 32 to 40 dB under the song. `--bed synth` (default, free) builds it from filtered noise: `room` (a quiet room's floor), `rumble` (distant traffic and the hum of the lights), `wind`, `rain`. `--bed sfx --prompt "..."` generates a 30-second looping bed with ElevenLabs sound effects instead (spends credits). |
| Sidechain the bed to the voice so it ducks 1 to 2 dB while they speak and swells back when they stop. | The bed goes through a compressor keyed by the vocal stem (`duck`, 1 to 2 dB; 25 ms attack, 450 ms release). |
| **3. The microphone (degradation).** High-pass below 80 to 100 Hz; gently roll off above 8 to 10 kHz to remove the digital sheen. | `hp` (80 to 100 Hz) and `lp` (9 to 11 kHz, a gentle 6 dB per octave slope) on the vocal, before the reverb. |
| Distance: the further the voice, the fewer highs and the lower the level. | Not used: the singer is always close to the camera in a reel. To move the voice back, lower `lp` and raise `wet` in a new entry: add a space to `SPACES` rather than a flag. |
| **4. Performance and pacing.** Breaths, sighs, pauses where a person would think; ellipses and em-dashes in the prompt. | This happens in the song, not in the mix, because the voice is generated together with the music. The brief asks for it (`prompts/briefs/slow-melodic.md`: rests after lines, `...` and em-dashes, audible breaths, held words), and asks for a dry, close vocal so that the room added here is the only room. Nothing is cut or pasted by hand: moving audio would break the word timings the captions use. |
| Checklist: voice → EQ → reverb → level; ambience low, sidechained to the voice. | That is the mix graph, in that order (`mix_graph` in `pipeline/ambience.py`). |

## The spaces

`python -m pipeline.ambience --spaces` lists them. The numbers live in `SPACES` in `pipeline/ambience.py`.

| Space | Use it for | Ring | Reflections | Bed |
|-------|-----------|------|-------------|-----|
| `studio` | no particular place; the safe default | 0.3 s | 24 dB under the voice | room, 40 dB under the song |
| `room` | a bedroom, a small shop | 0.5 s | -20 dB | room, -36 dB |
| `hall` | a trading floor, a station hall, a lobby | 1.3 s | -19 dB | room, -36 dB |
| `carpark` | concrete, a basement, an underpass | 1.9 s | -17 dB | rumble, -33 dB |
| `outdoor` | open air, a rooftop, a field | slap 32 ms | -26 dB | wind, -34 dB |
| `street` | a street between buildings | slap 36 ms | -24 dB | rumble, -33 dB |
| `rain` | a wet street | slap 36 ms | -24 dB | rain, -32 dB |

`--amount` scales the reflections, the slap and the bed together (0.5 takes 6 dB off each; 0 leaves only
the microphone roll-off). The roll-off itself does not change.

## Choosing the place

1. The song names it. A brief that wants ambience makes the writer begin `reel_notes` with
   `PLACE: <place> | <indoor-small, indoor-large or outdoor> | <three sounds heard there>`.
2. Map it to a space: indoor-small → `studio` or `room`; indoor-large → `hall` or `carpark`; outdoor →
   `outdoor`, `street` or `rain`. If no synthesised bed matches the three sounds, use `--bed sfx` with
   those sounds as the prompt.
3. The video is then set in the same place: the brainstorm looks for footage of it, and the plan shown
   to the user names the place and the space.

## What it costs and what it keeps

- On 2026-10-12 the split and one generated bed together cost 955 credits.
- The split spends ElevenLabs credits once per week (it is the same split `pipeline.revoice` makes; if
  `output/WEEK/revoice/` already has `vocals.mp3` and `instrumental.mp3`, copy them and `original.mp3`
  into `output/WEEK/ambience/` and nothing is spent). `--bed sfx` spends credits once per prompt.
  Say so before running.
- `output/WEEK/ambience/original.mp3` is the song as generated. Every run starts from it, so the step
  can be repeated with another space or amount, and copying it back over `audio.mp3` undoes the step.
- The length and every word time are unchanged: `subtitles.srt` and `timeline.json` stay valid.
- `output/WEEK/ambience/ambience.json` records the space, the measured gains, the level before and
  after, and the share of lyric words heard before and after.

## What cannot be checked here

Claude cannot hear the result. It checks levels and the listening score and says so; the user's ear
decides. Trial mixes (`--out NAME`) sit beside the original for comparing before `audio.mp3` is replaced.
