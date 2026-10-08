# scribble-pixel

Kinetic type with hand-scribbled words, pixel-art icons and quick pen lines, cutting between an off-white and a black ground.

- **First used:** 2026-10-07
- **Reference:** `reel/references/scribble-pixel.mp4`
- **Worked example:** `reel/days/2026-10-07/`

## Look
- **Grounds:** off-white `#E9E7E4` with ink `#111111`, and near-black `#0B0B0B` with `#F4F2EE`. One full-red frame at most. Hard cut between grounds on each lyric line.
- **Accent:** red `#E23A2E` only, for the number or word that matters and for strikes.
- **Type:** Archivo Black caps for slammed words, Reenie Beanie scribble for one hero word per section, Space Grotesk 700 for small lines and the running caption.
- **Icons:** pixel-art sprites in their own colours (`lib/pixel.js`), with a one-pixel ink outline.

## Motion
- Each sung word arrives on its own time: slam, squash, side slide or rise (`R.fx`).
- Every shot lands with a small punch and keeps pushing in slowly.
- Numbers roll to their value and shake the frame when they land.
- A red scribbled strike goes through what the lyric says is over.
- Pen lines (`lib/ink.js`), about a dozen in the whole reel, each tied to something: an icon rides in on a line, a line whips through a word as it lands, a lasso squeezes a word, a stretch of line zips across on a beat.
- Ending: a circle opens from the signature into the light ground and the day's icons settle on a loose grid around it, so the loop back to the first frame is a cut between two frames of the same colour.

## Structure
One shot per lyric line or pair of lines. The hook's return swaps the grounds and adds an icon swarm. Double-time passages get the shortest shots and no caption.
