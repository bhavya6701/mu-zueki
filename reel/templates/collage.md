# collage

A torn-paper street collage cut hard to a mid-tempo band groove: stock footage fills the frame, the words sit on torn tape strips and red rubber stamps, cream paper scraps are pasted over the edges, and reaction GIFs slap on as white die-cut stickers on the punchlines. Cheeky and fast.

- **First used:** 2026-10-13 (a 96 BPM live-band sung-rap song set on the steps of a bank tower; street ambience)
- **Reference:** `reel/references/collage.mp4` ("Paper Collage Intro, Street & Grunge Style" by YouMotion, https://youtu.be/pxnhYIj269k): vertical, torn cream paper, cut-out subjects, red tape strips, condensed type, a new layout on every beat. Stickers after "VIDEO MOTION - Collage & Stickers" (https://youtu.be/rhP7lvf-C2A).
- **Worked example:** `reel/days/2026-10-13/` (`plan.md` is the plan the user approved)
- **Kit module:** `reel/lib/collage.js` (`R.clg`); shots are made with `C.over(caps, build, options)` (or the day's `R.day.over`, which adds two paper scraps) and carry `look: "collage"`, ground `clear`
- **Default pool:** yes

## Look
- **Ground:** the day's footage, graded a little muted (`eq=contrast=1.15:saturation=0.55` to `0.8`) so the red, yellow and cream of the paper carry the colour. Green-screen clips are keyed onto cream `0xEDE4D0`, which reads as a cut-out pasted on paper.
- **Type:** Anton capitals on torn tape strips (`C.tape`: cream, red, yellow or black), one or two per shot, top band (y 300 to 450) and lower band (y 1100 to 1200). Rubber stamps (`C.stamp`, red ink) for the figure or the punchline.
- **Lyric:** the kit's caption line at y 1336, each word on its own cream tape in Anton.
- **Stickers:** GIFs are footage entries on track 1 with a `rect` in the middle band (y 420 to 1100); `C.sticker(id, t, rot)` gives them the white border, shadow and slap. They sit above the shot's type, so keep tapes out of the rectangle.
- **Drawn gags** where no GIF is wanted: `C.forgot` (crossed-out arrow), `C.pickaxe`, `C.mic`, or any marker drawing with `C.drawing`.
- **Over everything:** paper grain (`.look-collage::after`). Two torn scraps at the top-left and bottom-right corners of every shot (pictures, no labels).

## Motion
- Everything lands with `C.slap`: a little big and turned, settling in three stop-motion steps (`steps(3)`).
- Pasted pieces boil on every beat (`C.boil`). Hits jolt the frame (`C.jolt`).
- A label can leave: slide the tape off the frame across the line ("shares slid away").
- The paper tears away upward (`C.rip`) where the full band comes back and on the sign-off.

## Sync
- Cuts sit on lyric-line starts measured from the vocal stem (correct `timeline.json` first; see `film.md`). A sticker lands on the line's stressed word (`word:N:I`), a stamp on the figure.
- A dash at the end of a line is timed as a word of its own: anchor a stab cut on it (`word:N:last`), not on `cut:N`.
- More than about 25 `<video>` elements make `hyperframes check` run out of its fixed 120 s budget. Give the full-frame background clips a `join` label in `footage.json` (consecutive runs), so each run becomes one clip.

## GIFs
- The user approved meme-original GIFs only (this-is-fine, a red candle, WAIT FOR IT, a dog on stairs, cash stacks, here-we-go-again), not clips from films, TV or cartoons. Search GIPHY by plain fetch (`giphy.com/search/WORDS`; the page lists `giphy.com/gifs/SLUG-ID`), download `media.giphy.com/media/ID/giphy.mp4`, loop it to about 9 s with FFmpeg into `reel/media/DATE/gif_NAME.mp4`, and add it to `credits.json`.
