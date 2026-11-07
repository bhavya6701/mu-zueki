# 2026-W44 plan: "The bill came due"

## Idea
The week plays as an arcade game whose credits run out. Every shot is a world inside a CRT screen
(scanlines, curved glass, phosphor glow over footage and pixel-art plates). pixelfx carries every hit:
coins drain as "the bill came due", explosions and lightning land on each record drop, and the reel
ends as the credit counter hits zero and cuts back to the first frame.

## Reference
"A History of Video Games" (https://whatships.com/videos/history-of-video-games/), excerpt in
`reel/references/arcade-crt.mp4`. Taken from it: CRT framing, a white flash into each new world, slow
camera drift, sprites always moving, a big glowing number with small spaced type under it. Not taken:
its corner HUD (score, credits), because of the clean-corners rule.

## Grade and type
Near-black navy ground, CRT scanlines, vignette and warp over everything (registry `yt-screen-warp`),
phosphor bloom. Red for losses, gold for money and the bill, green only for the Russell line.
Type: Archivo Black for slammed words, JetBrains Mono 800 for numbers and the caption.

## Line by line (BG = background, MID = middle, FX = pixelfx, TYPE = front)
| Lines | Time | BG | MID | FX (pixelfx) | TYPE |
|---|---|---|---|---|---|
| 1-2 Last week of October, the AI bill came due | 0.0-1.7 | Gemini pixel Wall Street at night | arcade cabinet clip (keyed) zooms to its screen | `ui/coin-collect` drains coins out (gold), `pickups/coin-spin` | "THE AI BILL" slams, "CAME DUE" stamps |
| 3-4 Friday hit the S&P, worst day since June | 1.7-3.8 | red falling chart (`decline-chart`) | | `explosions/big-explosion` on "hit", `impacts/*` shake | "WORST DAY SINCE JUNE" |
| 5-6 Three red weeks running, spending outran the cash | 4.1-5.8 | dark CRT field | three pixel red candles (custom pixelfx `finance/red-candles`) | candles fall one per beat | "3 RED WEEKS" |
| 7-8 Bill came due x2, tech took the crash | 5.8-7.8 | burning money clip | | `ui/damage-number` "-1.8%", `transitions/glitch-wipe` out | "BILL CAME DUE" twice, second glitched |
| 9-11 7,580 ... 0.6% down, third loss | 8.7-11.8 | trading-screens clip, CRT warped | | `ui/health-bar-hit` 3 hits (from 0.8 to 0.45) | "7,580" counts, "-0.6% WK" |
| 12-13 Nasdaq bled 2.9%, a Friday in red | 11.8-14.0 | Gemini pixel city in red light | | `status/bleeding` drip, `ui/damage-number` "-2.9%" | "NASDAQ -2.9%" |
| 14-15 Nvidia down 4.9, heaviest drag | 14.0-16.0 | computer chip clip | | `lightning/zap-hit` on the chip, `ui/crit-number` "-4.9%" label "DRAG" | "NVIDIA" |
| 16-17 All three indexes lower, every chart a red flag | 16.0-18.0 | dark field | three red flags of `R.chart` bars | `explosions/firework-burst` recoloured red, x3 | "S&P  NASDAQ  DOW" all red |
| 18-19 Wall Street fears the spending, AI burning through the bag | 18.0-20.0 | data-centre clip | | `fire/flame-pillar` up the racks, `fire/fire-ring` | "BURNING THROUGH THE BAG" |
| 20-21 Only small caps smiling, Russell up 1.3 | 20.0-21.6 | Gemini pixel street at dawn (the one green shot) | | `ui/level-up` text "+1.3%" (green palette), `holy/sunburst` | "RUSSELL +1.3%" |
| 22-23 Big tech paid the bill, the little guys walked free | 22.0-23.9 | same street | | `pickups/coin-spin` small, walking away, `weather/fireflies` | "BIG TECH PAID" |
| 24-31 Hook again | 23.9-31.8 | as lines 1-8, worlds swapped to red, faster cuts | | same effects, bigger scale; `transitions/crt-off` into verse 3 | |
| 32-35 Wednesday the Fed held at 3.75 to 4, 10 to 2, two wanted a hike | 31.8-35.7 | Fed clip, then Gemini pixel Fed | uiverse retro level-up toast (rebuilt) "FED HOLDS 3.75-4.00%" | `arcane/rune-circle` slow loop behind, `ui/combo-counter` "10-2" | "HOLD" |
| 36-39 Thursday Alphabet fell 12.6%, worst ever, half a trillion gone, stormy weather | 35.7-39.9 | Gemini pixel storm over the city | | `lightning/thunderclap`, `ui/crit-number` "-12.6%" label "WORST EVER", `weather/storm` (cover) | "$500B GONE" |
| 40-42 Amazon spending $220 billion, $42 billion out the door | 39.9-43.9 | data-centre clip, Gemini pixel data centre | | `spawn/coin-drop` gold pouring, `shadow/black-hole` swallowing coins | "$220B IN", "$42.4B OUT" |
| 43-44 Intel guided $15 to $16 billion, short | 43.9-45.9 | chip clip, drained to grey | | `ui/countdown` 3-2-1 | "$15-16B" |
| (beat cut) | ~45.9 | black, held | | | |
| 45-46 Friday down near 29%, worst since 1974 | 45.9-47.4 | white flash, then black | | `explosions/nuke` full height, `ui/damage-number` "-29%" | "WORST SINCE 1974" |
| 47-51 Spend it, burn it, build it, prove it ... every dollar, every deal | 48.4-52.0 | flash cuts: servers, chips, burning money, screens | | one effect per phrase: `explosions/small-explosion`, `fire/fireball`, `scifi/emp-blast`, `ui/confetti`, `pickups/loot-beam` | one word per cut |
| 52-53 Bill came due. That's the tape. Mu-Zueki. | 52.0-56.0 | arcade cabinet, its screen | | coins drain to zero, `transitions/crt-off` | "BILL CAME DUE", "MU-ZUEKI" in the pixel frame; last frame matches the first for the loop |

## What each resource gave
1. Vecteezy: arcade cabinet (pixel art, green screen), data centre, Fed building, burning money, trading screens (spare). The Space Invaders cabinet is not free.
2. Dareful: not reachable (403, behind its bot check).
3. Magnific: 48 free pixel-art clips, all landscapes and night skies; none used (the Gemini plates fit the week better). Finance clips are Premium.
4. getillustrations: no pixel-art packs; the doodle styles would clash. Nothing used.
5. uiverse: retro level-up notification (MijailVillegas, "swift-fireant-79") rebuilt as the Fed toast; pixel button (Galahhad, "odd-yak-40") as a spare. Authors credited.
6. whatships: the reference, chosen from nine posters and two clips watched.
7. YouTube: pixel-art mood shorts confirmed the 9:16 pixel-plate idea; nothing taken. yt-dlp could not be installed (PyPI timed out), so I searched in Chrome.
8. recent.design: a pixel commuter at a red light gave the idea of pixel-art plates of real places; nothing taken.
9. land-book: "pixel" finds app pages, nothing fitting. lapa.ninja: the extension has no permission for the site.
10. Registry: `yt-screen-warp` (CRT grade), `decline-chart` (S&P line), `rgb-glitch-text` (the glitched "bill came due").
11. Repository: the kit, `R.chart`, `pfx.js`; no past reel used this look.
12. GIPHY: not used (no stickers asked for).
13. Gemini: 5 frames, below.
14. pixelfx: about 30 effects as listed, recoloured; one new effect, `finance/red-candles`.

## Gemini (5 of about 10 a day, 9:16, pixel-art style, no people, no text, no logos)
1. Wall Street at night, a canyon of towers with red ticker light.
2. The Federal Reserve building at dusk, still and cold.
3. A data centre aisle of glowing racks, heat haze.
4. A city skyline under a storm, lightning-ready.
5. A quiet side street at dawn, warm light (the Russell shot).

## To decide
- The new pixelfx effect `finance/red-candles` (three red candles falling, about an hour of work) or an existing effect in its place (`ui/health-bar-hit`).
- Gemini: the 5 frames now (Chrome is connected), or code-and-footage only.
