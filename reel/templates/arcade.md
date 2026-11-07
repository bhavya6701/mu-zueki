# arcade

The week as an arcade game played on a CRT: every shot is a world inside the screen, pixelfx effects land on every hit, and numbers glow in a pixel face.

- **First used:** 2026-W44 (the first weekly reel and the first built with pixelfx)
- **Reference:** `reel/references/arcade-crt.mp4` ("A History of Video Games", https://whatships.com/videos/history-of-video-games/)
- **Worked example:** `reel/weeks/2026-W44/`
- **Kit module:** `reel/lib/arcade.js` (`R.arc`), with `reel/lib/pfx.js` (`s.pfx`); shots carry `look: "arcade"`

## Look
- **Worlds:** Gemini pixel-art plates (`A.plate`: Wall Street at night, the Fed at dusk, a data centre, a storm skyline, a street at dawn), stock footage graded to the week's mood, or the near-black ground `navy`. A green-screen pixel cabinet (keyed in `footage.json` with `key` and `screen`) opens and closes the reel.
- **The CRT over everything:** scanlines, a pixel grid, a glass sheen and a deep vignette (`.look-arcade::after`, after the registry's `yt-screen-warp`).
- **Colour:** red `#FF3B3B` for losses, gold `#FFC94A` for money and the bill, green `#47E06A` only for what went up, white for names.
- **Type:** Silkscreen bold (`font: "pixel"`) with a glow (`A.row`, `A.words`) for names and figures; JetBrains Mono, widely spaced (`A.sub`), for the small line under a figure, as in the reference's year cards; RGB-split glitch type (`A.glitch`, after the registry's `rgb-glitch-text`) for the words that break. The caption is JetBrains Mono 800 with a dark edge.
- **Interface:** a retro notification card for a decision (`A.toast`, after uiverse.io's level-up notification by MijailVillegas); a price line that draws itself downward (`A.decline`, after the registry's `decline-chart`).

## Motion
- A white flash opens each new world (`A.flash`); a red flash marks a loss.
- Every hit word gets a pixelfx effect: explosions and lightning for the drops, `ui/damage-number` and `ui/crit-number` with the figure as their text, `finance/red-candles` for losing weeks, coins (`spawn/coin-drop`, `pickups/coin-spin`) for money, `ui/level-up` in green for a gain, weather loops (`weather/storm`, `weather/fireflies`) under the mood shots, `transitions/glitch-wipe` into a cut.
- Plates drift and zoom slowly; the camera punches in on each cut and shakes on the hardest hits.
- Numbers roll to their value (`R.fx.count`).
- The screen switches off (`A.crtOff`) to close a section and to end the reel, so the loop restarts on the cabinet.

## Safe area
- Type, the caption and pixelfx effects that draw figures stay inside the cautious vertical-video margins
  (top 288, right 192, bottom 672 px): the stage is 345-1090 px and 96-858 px across (inset for the 9 % camera push-in), the caption 1110-1240 px
  (set on `.look-arcade` in `reel/index.html`, after the video-review check of 2026-11-04). Pixel type has a dark
  edge so it reads over fire and bright chips.

## Structure
- One shot per lyric line or pair of lines; the double-time run gets one flash cut per phrase with one effect each.
- Hook returns in other worlds (the cabinet again, then the storm, then the data centre).
- Sign-off: back at the cabinet, the hook word glitched, "That's the tape", the name in gold, then the screen switches off.
