# 2026-10-12: plan for the reel (approved by the user on 2026-10-14; cutaways kept)

## The idea
A night film, not a lyric poster: one man at a petrol pump in the rain, watching a split market day go by.
The song is slow and sung, so the video is slow too: long held shots, soft cross-dissolves on the beat,
and a held word that grows large while the singer holds the note. Every figure of the day appears on one
recurring object, the station's LED price signboard.

## One place for everything
- **Song:** "Petrol pump at night in rain" (the song's own PLACE line). 78 BPM, D minor, nylon guitar,
  Rhodes, brushed drums, bass, strings, cello, bansuri.
- **Ambience:** the `rain` space of `AMBIENCE.md`: a 36 ms slap off the walls, the voice rolled off at
  100 Hz and 9 kHz, a generated bed of rain on a metal canopy 32 dB under the song, ducking 2 dB under the voice.
- **Video:** night footage of a station, wet roads and rain; drawn rain streaks and film grain over every
  shot so the clips share one weather; cuts and dissolves on the downbeats; the picture breathes (no type,
  only rain) on the three "—" pauses.

## Reference (searched)
"ACHX Studio" launch film, https://whatships.com/videos/achx-studio/ : cinematic footage with grain and a
slight colour fringe, thin white serif type with one word in acid yellow, and a single serif word that
fills the frame on the important beat. Compared with "After the IDE" (whatships; documentary subtitles,
too plain) and a film-style official lyric video on YouTube (monospace subtitles on black-and-white
footage, too dark). New look: `film`.

## Line by line
| # | Lyric | Picture (Vecteezy id) | On it |
|---|-------|------------------------|-------|
| 1 | Monday night, a petrol pump, the rain | Night petrol station, wide (2021795) | "Monday night" small serif; hold on "rain" |
| 2-3 | The Dow rose 195... / up high | Station out of focus at dusk (77160147) | LED signboard lights up: DOW +195.60, 51,850.55; "high" grows large in yellow |
| 4 | Nasdaq fell — | Raindrops in slow motion (77087303) | Signboard row: NASDAQ -0.44% in red; then only rain |
| 5 | The other indexes slipped tonight | Young man reading his phone on a wet night street (51266885) | A "Tonight" card: Dow up, S&P -0.06%, Nasdaq -0.44% |
| 6 | Oil runs high, the chips fall low | Fuel nozzle close-up, graded to night (51842757), then a glowing chip (51895602) on "chips" | "high" rises, "low" sinks |
| 7 | The pump keeps humming, on and slow | Fuel gauge needle (78569089) | A pump counter turning slowly: BRENT $ per barrel |
| 8 | One index up — | Empty road in the rain, lights out of focus (74601230) | Nothing: the breath |
| 9 | The Dow walks home alone | A man walking alone under street lamps in fog (52003485) | "alone" fills the frame, the longest hold |
| 10 | Brent crude, $106 a barrel | Black oil barrels (57056238) | Signboard: BRENT 106.65, +1.8% |
| 11 | Staring down that barrel, in the rain | A hand on the nozzle (1618137) | Hold on "rain" |
| 12 | Micron fell — | Rain rings in a puddle (2912283) | "Micron" then only rain |
| 13 | Nearly 4%, just gone | Falling candle chart (60239030) | "-3.88%" fades away on "gone" |
| 14 | Memory chips... forgot the way back home | A memory stick on black (42573848), then tail lights leaving on a wet road (72542358) on "home" | Hold on "home" |
| 15 | Chips slid — | Rain on glass, lights behind (1627234) | The breath |
| 16 | Only the Dow closed high | The station at dusk, unmoving (77160134) | The line alone, centred, "high" in yellow |
| 17 | Tomorrow the big banks... | Rain on glass (1627234, later part) | A "Tomorrow" notice: JPMorgan, Goldman Sachs, Citigroup, Wells Fargo report |
| 18 | tonight, the rain | Rain dripping off a roof edge (1792559) | Hold on "rain" |
| 19 | Signboard flickers low | Wet street with a red neon OPEN sign (76915135) | The LED signboard flickers and dims |
| 20 | The Dow walks home alone | The walker again, further away (52003485, start of clip) | "alone" once more |
| 21 | That's the tape. Mu-Zueki. | Black, rain only | A cassette card and the sign-off |

## What each resource gave
1. Vecteezy: all the footage above (about 18 free clips; attribution required in the post).
2. Dareful: not reachable. Still behind its bot check in Chrome; not bypassed.
3. Magnific: opens in Chrome, but all 50 results for "gas station night" are Premium. Nothing taken.
4. getillustrations: doodle and character packs; nothing that belongs in a night film. Not used.
5. Uiverse: a "Today" weather card (jamik-dev) becomes the "Tonight" card of line 5; a cassette card
   (Praashoo7) becomes the sign-off. Rebuilt on the timeline, authors credited.
6. whatships: the reference (ACHX Studio).
7. YouTube: one lyric-video candidate looked at, not chosen.
8. recent.design, 9. land-book, lapa.ninja: opened; nothing specific to this day.
10. HyperFrames registry: `grain-overlay`, `vignette` and the seek-safe `snow` overlay are the models for
    the grain, vignette and rain layers (rebuilt on the day's timeline so they seek exactly).
11. This repository: the footage pipeline of 2026-10-09 (`footage.json`), with a new quiet look instead
    of the loud slap type.

## To decide
- Line 10 leaves the station for oil barrels, and lines 6/14 for chips. Keep these cutaways, or stay at
  the station throughout?

## As built
- Line 1 uses the out-of-focus station (the sharp clip is a time-lapse and too fast for the song); line 16 uses the same station.
- Phrase onsets of lines 6, 9, 10, 15 and 17 were corrected from the vocal stem, so cuts and words land on the voice.
- The sign-off is not spoken in this take: after the music ends, the last three seconds are rain only, with the cassette and the name.
