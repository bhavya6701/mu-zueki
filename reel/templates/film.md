# film

A slow night film for a slow, sung song: footage of one place fills the frame, drawn rain and film grain run over every clip, and the lyric is set in a thin serif with one word in sodium yellow. A held note gets its word set large, growing for as long as the note lasts.

- **First used:** 2026-10-12 (a slow sung-rap song set at a petrol pump in the rain; the song got its ambience first, see `AMBIENCE.md`)
- **Reference:** `reel/references/film.mp4` (the ACHX Studio film, https://whatships.com/videos/achx-studio/): grainy cinematic footage, thin white serif with one yellow word, one serif word filling the frame on the big beat
- **Worked example:** `reel/days/2026-10-12/` (`plan.md` is the plan the user approved)
- **Kit module:** `reel/lib/film.js` (`R.film`); shots are made with `F.shot(caps, build, options)` and carry `look: "film"`, no caption line and no punch-in

## Look
- **Ground:** always the day's footage (`footage.json`), graded towards night: lower brightness, less saturation, a little blue (`colorbalance=bs=...`). Daytime close-ups (a nozzle, a hand) are darkened and cooled until they sit with the night clips. The sign-off is on black.
- **Over every shot:** a vignette, a dark foot under the lyric, rain streaks (`rain: N`, 0 indoors or on a screen), and one grain layer over the whole reel.
- **Type:** Instrument Serif, bone white `#F4EFE6`, 84 px, centred, top at y 1190; the word that carries the line in sodium yellow `#F5D547`, an aside in italic. Red only for a loss.
- **Held word (`F.big`):** italic, up to 420 px, yellow, with a slight red and cyan fringe; it sits where the picture is empty (above a walker, over the sky).
- **Things of the place (`F.board`, `F.counter`, `F.card`, `F.notice`, `F.cassette`):** the figures are never loose type. They sit on an LED price signboard (amber dots, red for a fall), a pump counter, a weather-style card, a notice, a cassette. One per shot, in the upper middle, away from a face.

## Motion
- Each word fades up and rises 18 px on the time it is sung. Nothing slams.
- A sign comes on with a stutter (`F.lightUp`) and fails with a flicker (`F.flicker`).
- Shots dip through black (`dip: [in, out]`, about a third of a second). One hard cut at most per section, on a word.
- A soft swell of light on each downbeat (`pulse`), stronger where an instrument enters (`F.swell`).
- Where the lyric has a pause ("—"), the shot carries the line and then nothing: rain only.

## Sync
- Cuts sit on the start of each lyric line; a cut inside a line sits on a word (`word:N:I`) and the cut after a held note on the next downbeat (`cut:N`).
- Whisper places the first word of a phrase early when an instrument plays before it. Check each phrase onset against the vocal stem (`output/DATE/ambience/vocals.mp3`, loudness per 20 ms) and correct `timeline.json` before building; keep the original as `timeline.whisper.json`.
- If the take does not speak the sign-off, show it after the music ends, over the ambience.

## Structure
- One shot per lyric line; two short lines may share one. The hook's last word is the longest hold.
- Last shot: black, rain, the cassette and the name.
