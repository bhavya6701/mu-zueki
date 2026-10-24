# 2026-10-13 reel plan (awaiting the user's yes)

## The idea
A torn-paper street collage cut hard to a 96 BPM live-band groove: real footage of the bank-tower street is torn
into strips and cut-outs, with bold type on tape labels and a Giphy reaction GIF slapped on every punchline as a
die-cut sticker. It should feel cheeky and fast: the banks made billions, the shares went down anyway, and the
GIFs say what everyone is thinking.

- Place: the steps outside a big bank tower at closing time; ambience `street` (amount 0.8, already in the song).
- Song: 96 BPM (78 yesterday), B-flat major; drums, finger bass, Rhodes, Hammond, brass riff, strings, wah guitar,
  congas, claps, glockenspiel. 54 s.
- Sync: every cut sits on a lyric-line onset measured from the vocal stem (timeline corrected; Whisper had the
  hook up to 0.5 s early and squashed the JPMorgan line). Sticker GIFs slam in on the line's stressed word; the
  brass stab after "Wait for it" (about 34.7 s) is a hard cut; the 23.9 to 26.0 s brass break is a torn-paper rip.

## Reference
"Paper Collage Intro, Street & Grunge Style" (YouMotion), https://youtu.be/pxnhYIj269k. Vertical 9:16, torn
cream paper, black-and-white cut-out subjects, red tape strips, condensed type on labels, a new layout on every
beat. Secondary: "VIDEO MOTION - Collage & Stickers" (https://youtu.be/rhP7lvf-C2A) for how stickers sit
(white die-cut border, slight tilt, peel-on).

## Line by line (picture / words or GIF on it)
| t (s) | Line | Picture | On it |
|---|---|---|---|
| 0.00 | Tuesday, bank tower steps, | `tower` low-angle towers, collage frame | TUESDAY on red tape |
| 1.20 | revolving doors spin round | `door` revolving door, feet passing | doors spin with a whip-pan |
| 2.54 | Banks brought billions home, | `dance` banker fanning dollar bills, cut-out | BILLIONS label |
| 3.22 | and the market still went down | `ticker` red board | paper arrow drops |
| 5.06 | Taxi horns are honking, | `taxi` yellow cabs | HONK sticker |
| 5.88 | suits with coffee leaving town | `coffee` man in suit with coffee | |
| 7.56 | S&P near flat, | `chart` screen | flat line drawn in marker |
| 8.22 | just under its record crown | same | paper crown just above the line |
| 10.04 | Memory stocks forgot the way up, | `chip` glowing chip | GIF: "I FORGOT" (Batman cartoon) |
| 11.36 | two days in a row | same | 2 DAYS tape |
| 12.24 | Doorman laughs, he's seen this movie, | `laugh` keyed cut-out of a laughing man | GIF: "Ah sorry, here we go again" |
| 13.18 | every quarter, same old sound | same | |
| 15.22 | The banks got paid, | `cashrain` keyed over `tower` | GIF: man buried in cash stacks |
| 15.72 | but the shares slid away | `ticker` | arrow slides off the frame |
| 17.56 | Billions in the bag | `bag` keyed money bag | |
| 18.66 | and still red on the day | | GIF: red candle "down only" |
| 20.08 | Fat on the profit, | `gold` bars | FAT set wide and heavy |
| 21.32 | thin on the price | | THIN set squeezed |
| 22.22 | Nearly flat, alright | | GIF: "Alright, alright, alright" (McConaughey) |
| 23.9 | (brass break) | torn-paper rip transition | |
| 25.96 | JPMorgan banked $15.3 billion, up 6% | `door`/`tower` | phone notification card "+$15.3B" (uiverse-style toast) |
| 28.26 | Goldman struck gold, profit up 29% | `gold` | GIF: penguins at a gold vault |
| 30.40 | trading paid the rent | `chart` | RENT: PAID stamp |
| 31.18 | Then both their stocks walked down / these same steps | `stairs` played in reverse | GIF: dog bumping down the stairs |
| 34.12 | Wait for it — | freeze frame | GIF: "WAIT FOR IT..." ; hard cut on the brass stab |
| 35.24 | Two Fed voices say one more hike / before the year is gone | `fed` Federal Reserve building | +1 HIKE sticker |
| 37.88 | Heating oil and diesel, Collins says, | `refinery` at sunset | |
| 39.14 | the heat is on | | GIF: "This is fine" dog |
| 40.04 | Dow closed at 51,670 (breakdown) | `ticker` darkened, still | counter to 51,670 |
| 42.88 | Down 180 points | | red -180 |
| 43.80 | on a payday Tuesday | `dance` | PAYDAY stamp |
| 46.16 | Hook again (paid / slid / bag / red) | `cashrain`, `ticker`, `bag` in new layouts | the cash and red-candle GIFs return |
| 52.22 | That's the tape. Mu-Zueki. | torn paper closes | GIF: Cookie Monster mic drop |

## What each resource gave
1. Vecteezy: 15 free clips downloaded (tower, door, dance, ticker, taxi, coffee, chart, chip, laugh, cashrain, bag,
   gold, stairs, fed, refinery); 3 NYC/Wall St clips were Pro-only. Credits in `reel/media/2026-10-13/credits.json`.
2. Dareful: bot check again in Chrome; not used.
3. Magnific: Wall Street all Premium; a few free green-screen paper-tear clips, not needed (registry covers it).
4. getillustrations: doodle/character packs only; nothing for a photo collage.
5. uiverse: notification cards (rebuilt on the GSAP timeline for the JPMorgan toast).
6. whatships: motion category browsed; nothing closer than the collage reference.
7. YouTube: the collage reference and the sticker reference.
8. recent.design: reachable; nothing used.
9. land-book / lapa: the Chrome extension has no permission for land-book; not used.
10. HyperFrames registry: `torn-paper-rip`, `paper-collage-reveal`, `freeze-frame-dressing` (paper, tape, flash).
11. Repo: `slap.js` type voices and UI elements, footage pipeline from 2026-10-09.
12. Giphy (new, user's request): reachable by plain fetch; 10 GIFs chosen as above.

## For the user to decide
- Giphy GIFs are clips from TV, films and memes owned by others. Giphy lets them be shared through its integrations,
  but baking them into a posted reel is a copyright grey area (Instagram's own reel editor offers GIPHY stickers).
  Options: keep all ten; keep only meme-original ones (this-is-fine, stonks/red candle, wait-for-it, dog on stairs,
  cash stacks); or none and I draw sticker gags instead.

## Agreed (2026-10-14)
The user said yes to the plan, with meme-original GIFs only: this-is-fine, red candle, WAIT FOR IT, dog on the
stairs, cash stacks, here-we-go-again. The other four spots get drawn gags instead: "I FORGOT" becomes a
crossed-out up-arrow with a "?" ; "alright" becomes a hand-drawn ALRIGHT x3 stamp; "struck gold" becomes a
pickaxe striking a gold bar with sparks; the sign-off becomes a drawn mic dropping.
