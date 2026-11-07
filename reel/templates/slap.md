# slap

A hip hop edit in two modes. **Over footage (the mode to use):** stock clips cut to each lyric line fill the frame, with a headline, the day's figures and interface elements over them and the lyric as a caption line. **Type only:** every lyric set large on flat colour. The user rejected the type-only mode on 2026-10-13 ("I don't want just the rap content stated in video format - have some visuals"); keep it for a line or two of contrast, not for a whole reel.

- **First used:** 2026-10-09 (third version of that day's video; the user chose "hip hop lyric video" after rejecting a technical poster look and a folk embroidery look)
- **Reference:** `reel/references/slap.mp4` ("Tv OFF! - Motion Graphics Typography" by y6richo, https://youtu.be/abkzFQ86CMY) for the type; `reel/references/mixed.mp4` ("Money Trees - Kendrick Lamar / Motion Graphics" by EDrie, https://youtu.be/PNY0ROl4oIM) for mixing footage, cut-outs and type
- **Worked example:** `reel/days/2026-10-09/`
- **Kit module:** `reel/lib/slap.js` (`R.slap`); shots carry `look: "slap"` and `caption: false`

## Look
- **Grounds:** `k-yellow` (`#F7CB15`), `k-pink` (`#E8134F`), `k-black`, `k-purple` (`#5B21E6`), `k-white`. One per shot, a different one on every cut. Green appears only for the word "green".
- **Four voices of type** (`G.row(col, words, voice)`):
  - `tall`: Anton, condensed capitals, for the one word of the line that carries it (a name, a number, the verdict).
  - `wide`: Archivo Black capitals, for the plain statement.
  - `serif`: Playfair Display black italic, lower case, for the connecting or quiet phrase.
  - `sticker`: Baloo Bhai 2 with a thick outline and a hard shadow (`G.stick`), for the figure or the punchline.
- **Full 9:16:** the rows of a shot are stretched upwards until the column fills the frame between the covered areas (`G.fill`, done automatically at the end of each shot), and a device behind the type covers the whole frame edge to edge: rays, halftone dots, a grid, fanning bars, slanted stripes, a wall of one phrase, a ghost word, streams of triangles.
- **Colour rules:** yellow or green for what went up, pink for what went down; never pink serif on yellow or yellow on pink (too little contrast).

## Motion
- Each word arrives on its own sung time: slammed (`G.slam`), popped, risen, dropped from the top with a bounce, thrown in from the side, or grown from its baseline.
- A word does what it says when the lyric allows: "run out of town" leaves the frame, "tossed" is thrown out, "washed away" drains off the bottom, "reeling" rocks, "knocked" takes the hit and stands, "lost" goes faint, a struck-out name gets a scribbled line.
- One flash and one shake for the hardest word of a stanza.
- Triangles stream up behind a gain and down behind a loss.

## Over footage
- **Plan first:** one clip per lyric line, chosen for what the line says (a roaring lion for "King is the Dow", three different cell towers for the three carriers, a wave for "washed away", an empty wallet for "who carries the cost", a cassette deck for "that's the tape"). List the lines, give each a subject, then search.
- **Fetch:** `python -m pipeline.stock search "cell tower"` lists free Vecteezy clips; `python -m pipeline.stock get DATE NAME ID-SLUG` downloads one into `reel/media/DATE/` and records its credit. Look at a strip of frames from every clip before using it.
- **Place:** `reel/days/DATE/footage.json` lists the clips: which one, from which lyric line to which (`cap:N`, `word:N:I`, `cut:N`, `end`), where in the source to start (`from`), how to crop (`x`, `y`, `rect` for half the frame), a grade (`look`, FFmpeg filters) and `key` to replace a green screen with a colour (`screen` names the screen colour when it is not pure green, such as `0x5AFF00`). `pipeline.video` cuts them to 1080x1920 and writes them under the scenes.
- **Scenes:** shots use the `clear` ground so the footage shows, with `G.scrim` for legibility. Type goes on plates (`G.plate`), gets a dark edge (`G.edge`) or is a sticker; one headline band at the top, one figure or element in the lower middle, the caption line under it.
- **Interface elements (`G.ui`):** each stands for something. On 2026-10-09: a carrier card whose signal bars fall to "NO SERVICE" on each tower, a "Call dropped" notification over an incoming-call screen, a slider that stops short of "ALL-TIME HIGH", three switches going on for the indexes and off for the carriers, a "Signed" button with a cursor, a disabled "Join the feast" button, a price tag that flips from 4.6% to 4.7%.
- **Credits:** the clips used are listed in `reel/days/DATE/credits.json`. Vecteezy's free licence requires attribution, so the Instagram description must carry a line such as "Stock footage: Vecteezy.com".

## Structure
- One shot per lyric line (a very short line shares a shot with the one before it). Double the cuts in the fastest stanza.
- **Last word:** black takes the frame and the word stands alone, as tall as it will go.
- **Sign-off:** cut to black on the downbeat after the last word, one dot through the silence, then the sign-off line and the name in sticker letters.
