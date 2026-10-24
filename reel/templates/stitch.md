# stitch

The whole 9:16 frame as an embroidered cloth: felt grounds, cut cloth figures with a running stitch round their edge, mirror work and sawtooth borders. Made for a song in a Gujarati bardic form; it suits any day whose song has a folk or regional voice.

- **Default pool:** no. Use this look only when the user asks for a folk or embroidered look.
- **First used:** 2026-10-09 (second version of that day's video). The user rejected it for that reel: they did not want the song's folk theme in the video.
- **Reference:** `reel/references/stitch.mp4` (a minute of "The Stitches Speak / Tanko Bole Chhe", Nina Sabnani's animated film made from Kutch appliqué and embroidery, https://youtu.be/CfjReP7SlnA)
- **Worked example:** not in the repository (the scenes are kept locally in `output/_archive/2026-10-09_v2/scenes/`)
- **Kit module:** `reel/lib/stitch.js` (`R.st`); shots carry `look: "stitch"`

## Look
- **Grounds:** `s-black`, `s-red` (madder), `s-indigo`, `s-mustard`, `s-orange`, `s-cream`. One per shot, changed on every cut.
- **Border, on every shot, outside the camera:** an edge strip, a band of mirror work with a hanging toran above, a band of patchwork squares below, and a sewn strip for the caption. This is what makes the frame full 9:16: the bands sit in the areas the platform covers, the picture between them. There are no labels, names, clocks or numbers in the corners.
- **Pieces:** everything is a flat cut shape with a dashed line of thread on its edge (`S.piece`), lines of stitches (`S.thread`), mirrors (`S.mirror`) and rows of triangles (`S.saw`).
- **Lettering:** Baloo Bhai 2 ExtraBold, as plain cloth letters or with a stitched edge for the one figure that matters; small phrases go on cloth labels (`S.label`).
- **Weave:** a fine grid over the whole frame.
- **The theme is shown, never named:** no word on screen says what tradition the look or the song comes from.

## Motifs and what each stood for on 2026-10-09
| Motif | Stands for |
|-------|-----------|
| `S.bard` (turban, moustache, a hand at his ear, the other thrown out) with `S.dhol` | the narrator: he opens the reel at sunrise and closes it at night |
| `S.horse` | an index: the Dow as a crowned rider under the arch, the S&P striding to a flag, three horses with green pennants, the Russell as a pony bolting from the town gate |
| `S.tower` (three in a row, the same row in every shot) | the three carriers: each rocks, loses its signal arcs and falls, and stays fallen in later shots |
| `S.spear`, stars of mirror | SpaceX and Starlink |
| `S.arch` palace, doors, a plate and pots | Wall Street and its feast; the doors shut on the crowd |
| crowd of `S.person` figures | the street: they line up, go dim, and at the end stand under the word "cost" with their arms up |
| a stitched face | consumer mood: the smile turns and a line of thread cracks it |
| `S.pot` on a shelf | prices |
| `S.scale` with `S.coin` | "kings count the gains, crowd counts the change" |
| `S.sun`, `S.moon`, `S.star` | the day: sunrise for the call, night for the sign-off, so the loop runs night into dawn |

## Motion
- Cut-out animation: pieces are put down a little crooked and settle (`S.drop`), pop (`S.pop`) or slam (`S.slam`); they do not glide or fade about.
- Horses gallop in two poses that change on the half beat (`horse.gallop`); the bard's mouth opens on each sung word (`S.speak`); the dhol is struck on the beat.
- The border is alive on the beat: mirrors wink, the patchwork squares take turns, the toran swings.
- State carries across cuts: what fell in one shot is lying there in the next.

## Structure
- **Call:** the bard and the sun, the day's figure counted up.
- **Body:** one tableau per line or pair, each a small scene that acts the line out.
- **Last word:** rows of the boast in outline, then the word alone with the crowd under it.
- **Sign-off:** night on the downbeat after the last word, the bard small under a moon, the name.
