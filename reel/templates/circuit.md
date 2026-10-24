# circuit

A black, red-orange and bone HUD world with manga panels and glitch-sliced type, plus a pastel idol twin for a sweet intro and sign-off.

- **First used:** 2026-10-08 (second version of that day, for a song that opens with a cute sung intro and drops into hard rap)
- **Reference:** `reel/references/circuit.mp4` ("KAMI Circuit", VJ visuals by aratama, https://whatships.com/videos/kami-circuit/)
- **Worked example:** `reel/days/2026-10-08/`
- **Kit module:** `reel/lib/circuit.js` (`R.cir`, and `R.cir.idol` for the pastel twin); shots carry `look: "circuit"` or `look: "idol"`

## Look
- **Grounds:** `ink` (near-black `#060606`, bone type), `flare` (red-orange `#FF3B14`, black type, white for the one loud word), `bone` (off-white `#EFECE6`, black type). Change ground on the lines that hit hardest.
- **Idol twin:** `candy` (pastel pink with polka dots), hot-pink rounded type with a white outline, stars, hearts, sweets and little microchips with faces.
- **Type:** Dela Gothic One capitals for the sung phrase and the numbers, JetBrains Mono for labels and the caption, Mochiy Pop One for the idol shots.
- **HUD:** on every shot except the manga panels: title, a running timecode, the BPM, corner marks, a level strip that jumps on the beat and a chapter label (`01 / DROP`, `05 / OIL`).
- **Green** appears once at most, for the one thing that went up.

## Motion
- Words slam in on their sung time; the biggest number of a line shakes the frame.
- A glitch burst (bands of the word jumping sideways in two colours) on the word that matters.
- Rings: dashed concentric circles turning against each other, as a badge around a figure, a scope or a record.
- Manga panels on the bone ground: speed lines that twitch on the beat, a speech bubble, a disc in the middle and a katakana sound effect (ドンッ for a thud, ゴゴゴ for a rumble). The caption gets its own panel there.
- Tile grids: chips that go dark one by one, pattern tiles that blink in triplets with the hi-hats, marks on a scope that light up.
- The picture does what the lyric says: plates squeeze a number "under pressure", "STRAIGHT" is set crooked, barrels slide off a shelf, a word "dives" out of the frame.
- When the drums drop out, the HUD strip goes flat and the frame holds still.

## Structure
- **Sweet intro:** idol shots, one per line. When the lyric turns, the number flickers, the colour drains to grey and the twinkling stops.
- **Beat cut:** the pastel picture collapses to a line on black.
- **Drop:** a white flash, then the whole frame in flare with the number in black.
- **Rap:** one shot per line or pair; double-time passages get the shortest shots and no running caption; a half-time ending gets one number filling the frame.
- **Sign-off:** back to the idol world, so the loop into the sweet intro is seamless.
