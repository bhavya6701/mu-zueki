# windows

A paper-coloured desktop: hairline windows, monospace type, meters and a cursor that clicks things open, with dark terminal shots in between.

- **First used:** 2026-10-08
- **Reference:** `reel/references/windows.mp4` (the Paper Mono font launch film, https://whatships.com/videos/paper-mono/)
- **Worked example:** not in the working tree. The scenes are in git history (`git show 986df7e:reel/days/2026-10-08/1-hook.js`, and `2-verse2.js` to `5-outro.js`); the render, song and timeline are kept locally in `output/_archive/2026-10-08_v1/`. `reel/days/2026-10-08/` now holds that day's second version (circuit).
- **Kit module:** `reel/lib/windows.js` (`R.win`); shots carry `look: "windows"`

## Look
- **Grounds:** `paper` (cream `#F4F3EC`, ink `#151515`) and `term` (near-black `#0C0C0C`, cream type). Alternate them shot by shot.
- **Accents:** blue `#3F74DE` for window lines and neutral glyphs, orange `#CF700C` for a second subject (oil on Oct 8), red for losses, green for gains.
- **Type:** JetBrains Mono, lower case. Bold 800 for the sung phrase, light 400 for connecting words and the caption.
- **Windows:** 3 px blue border, a title bar with a file-like name (`nasdaq.chart`, `count.sh`) and a soft offset shadow.
- **Texture:** patches of faint machine text behind the paper shots (`W.ascii`).

## Motion
- Things open, they do not fly: a window is simply there, a touch small, then full size (`W.open`).
- The cursor travels to a window and clicks; the click is the cue for what opens or changes there (`W.cursor`).
- Big figures are set as a row of glyph cards, one character per window, opening in sequence (`W.cards`).
- Data shows as it would on a desktop: tables that type in line by line, progress bars that fill, hairline charts that draw, a switch that flips.
- A word stacked in growing weight for an opening or a sign-off (`W.stack`).
- Windows pile up in a cascade when the lyric repeats itself.

## Structure
One shot per lyric line or pair. The hook's return swaps paper and terminal. Double-time passages drop the caption. The last second returns to paper with the name as glyph cards, so the loop back to the first frame stays on one ground.
