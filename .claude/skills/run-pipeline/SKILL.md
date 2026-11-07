---
name: run-pipeline
description: Use when asked to run the Mu-Zueki pipeline, make this week's reel, build or redo a week's video, or run the whole thing for a week. Covers the song stages, asking for the reference video, brainstorming the video across every resource (stock, illustrations, interface elements, references, the registry, pixelfx, Gemini frames), writing the week's scenes and rendering the reel.
---

# Run the Mu-Zueki pipeline

The series is **weekly**: one reel per trading week (an ISO week such as `2026-W44`, Monday to Friday),
made after Friday's close and about 60 seconds long. A reel is a song (Python, `pipeline/`) and a video
(HyperFrames, `reel/`). The song stages run on their own; the video needs a reference, a brainstorm and
scene writing, so it is done here.

The order is fixed: **song, ambience (when the song is set in a place), reference question, brainstorm
across every resource, the user's yes to the idea, build, record, post.** The 2026-10-09 reel was built
four times because the brainstorm and the yes were skipped; do not skip them.

The aim is a reel that looks like it came from a big studio while staying in the series' style: every
shot is **layered and mixed** from several resources (section 3e), not one stock clip with type on it.

## 1. Song stages

Run `.venv\Scripts\python.exe -m pipeline --week last` for the week that just ended, or `--week
YYYY-Www` for the week the user named (without `--week` it uses the newest news file). It skips finished
stages. Read `output/WEEK/status.json` afterwards.

- If `raw_data/us_finance_news_week_WEEK.json` does not exist, the run first gathers that week's top ten
  stories from the web and fact-checks them (`pipeline/news.py`; 15 to 30 minutes, no ElevenLabs
  credits). It refuses a week whose Friday session has not closed. Read the new file's
  `metadata.limitations` and tell the user what was dropped or weakened. If it refuses, report that and stop.
- The audio stage is the only one that spends ElevenLabs credits (about 450 per minute of song, per take).
  If the week has no `audio.mp3` yet, say so before running.
- If the user asks for a different kind of song (structure, voices, sound) or to redo a week's song:
  copy `output/WEEK/` to `output/_archive/` first, write or pick a brief in `prompts/briefs/`, and run
  `--from song --brief FILE [--vocal both] --stop-after song`. Read `song.md` (do the lyrics follow the
  brief and the news?) before running the audio. A new song means the week's scenes must be rewritten.
  You cannot hear the result: check `audio.json` (words heard per section) and say so.
- If the user likes a song's music, beat and flow but not its voice, do not regenerate it (a new take
  changes the music too). Run `python -m pipeline.revoice WEEK VOICE_ID`: it splits the track, converts
  only the vocal to another ElevenLabs voice and mixes it back over the same instrumental, so word timings
  stay valid. `--voices` lists the voices; `--out NAME` writes a trial mix. It spends credits (about 250 per
  conversion on 2026-10-11).
- `--length 45|60|90` sets one run's reel length (default 60).
- What the user liked in the song experiment (The Unbowed, 2026-10-27): a tight, syncopated flow with
  triplet pockets and internal multisyllabic rhymes, at about 90 BPM, ending on an echo of the hook. They
  rejected a closing spoken moral line. The prompts carry this; keep it in mind when writing a brief.
- If a stage is `failed`, stop and report it. If it is `needs_review`, report the reason and carry on only
  if the user agrees.

## 1b. Ambience (before any video work)

When the user asks for ambience, or the brief put a `PLACE:` line at the top of the song's reel notes,
put the song in that place before the video is started: `AMBIENCE.md` has the guidelines and the table
of spaces.

- `.venv\Scripts\python.exe -m pipeline.ambience WEEK --space NAME` (`--spaces` lists them). It splits
  the song into stems, which spends ElevenLabs credits once per week: say so before running.
- Keep it subtle: the ambience must never affect the song or make the voice sound artificial. Read
  `output/WEEK/ambience/ambience.json` afterwards and report it. You cannot hear it; say so.
- The video is then set in the same place: name the place in the plan (3d).
- Before building, check the phrase onsets against the vocal stem and correct `timeline.json` where Whisper
  placed a line early (`reel/templates/film.md`, "Sync"). On 2026-10-12 five lines were off by 0.2 to 1.5 s.

## 2. Ask for the reference (always)

Before any video work, ask the user with AskUserQuestion. Never skip this, and never pick for them:

| Option | What it means |
|--------|---------------|
| My own video | The user gives a file path or URL. |
| Default | A random template from `reel/templates/`, but not the one used for the newest entry in `reel/references/log.json`, and not one marked `Default pool: no`. |
| Search yourself | Find a new reference that fits the week, as part of the brainstorm below. |

Whatever they answer, the brainstorm in section 3 still happens: the reference sets the editing style,
the brainstorm decides what is in the picture.

## 3. Brainstorm the video across every resource (always)

Before writing any scene, go through **every row** of the table below, with the week's song in hand, and
collect what each one offers. Do not stop at the first site that returns something, and do not build
from memory.

### 3a. Read the week
Read `output/WEEK/song.md` and `timeline.json`: the stories, the mood, the BPM and bar grid, the lyric
lines and their times, and the reel notes. Write down, line by line, what the line says and what could be
seen while it is sung (a place, a thing, an action, a number, a company), and which lines are the week's
big beats (the lead story's turn, a record, a crash, a Fed decision): those are candidates for a Gemini
hero frame (3f).

### 3b. Sweep the resources
For each row: open it the way the row says, search it for the week's subjects, and note what you found
(or that it could not be reached, and why). Several sites answer only to a real browser: use Claude in
Chrome. If the extension reports it is not connected, start Chrome yourself
(`Start-Process "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Google Chrome.lnk"`) and retry; ask
the user only if it still fails. A site that cannot be reached must be named in the plan, not dropped.

| # | Resource | What to look for in the brainstorm | How to reach it (last checked 2026-11-04) |
|---|----------|------------------------------------|-------------------------------------------|
| 1 | https://www.vecteezy.com/free-videos | **Footage for each lyric line.** Search every subject from 3a (two or three wordings each). | `python -m pipeline.stock search "WORDS"` lists the free clips; `python -m pipeline.stock get WEEK NAME ID-SLUG` downloads one (up to 2560x1440) and records its credit. Paid ("Pro") clips are skipped. Searches of three or more words usually 404: use two words. More than two downloads at once get HTTP 429: fetch one at a time with a pause. The free licence requires attribution in the post. |
| 2 | https://dareful.com/ | Free 4K camera footage (cities, nature, weather, crowds) for lines the first site cannot cover. | Behind a bot check. Never try to get past it yourself: ask the user to open the site once in Chrome and pass it, then retry; if it still blocks, list it as unreachable. |
| 3 | https://www.magnific.com/videos | Stock and generated video; look for the stylised or impossible shot (a symbol, a metaphor). | Refuses plain fetches (HTTP 403) but opens in Chrome through the extension. Many clips are Premium: use only the free ones (`magnific.com/search?format=search&type=video&query=WORDS&license=free`), and check the licence of anything taken. On 2026-11-04 its free pixel-art clips were landscapes only. |
| 4 | https://getillustrations.com/ | Illustration packs: a consistent set of drawn figures or objects for an illustrated reel, or cut-outs over footage. | `curl` with a browser user agent. Check each pack's licence; note which packs are free (`/free-illustrations`). |
| 5 | https://uiverse.io/ | Interface elements that can act out a line: toggles, sliders, notifications, loaders, cards, buttons. | Clone `uiverse-io/galaxy` (MIT) shallow into the scratch folder and `grep` for the week's words. Rebuild the element on the GSAP timeline (`reel/lib/slap.js` has a set) and credit the author. |
| 6 | https://whatships.com/ | **Editing-style references.** About 2,400 launch and motion films. | `curl` works. `sitemap.xml` lists every `/videos/NAME/`; `/videos/category/motion/` and `/design/` are the non-product ones. Each item page has a `video.twimg.com` MP4 and an `og:image` poster: fetch 15 or so posters first, download only the one or two that fit. |
| 7 | YouTube, Vimeo | Editing-style references: music-video edits, kinetic typography, mixed-media edits, title sequences, studio motion reels. | `yt-dlp` in a scratch virtual environment (`ytsearch8:WORDS`), at 480p; keep only a short excerpt in `reel/references/`. If PyPI times out (it did twice on 2026-11-04), search youtube.com in Chrome instead. |
| 8 | https://recent.design/ | Recent motion and interface studies, for a transition or a layout idea. | `curl` with a browser user agent; the feed is built by scripts, so use the browser tools to read items. |
| 9 | https://land-book.com/, https://www.lapa.ninja/ | Landing pages with motion, for a palette, a type pairing or a layout; lapa.ninja's Showreel.Design for editing-style references. | Refuse plain fetches (HTTP 403). Open them in Chrome through the extension; if it has no permission for the site, ask the user to allow it, or list it as unreachable (lapa.ninja had no permission on 2026-11-04). |
| 10 | HyperFrames registry | Ready-made blocks and effects (charts, maps, glitch, grain, transitions, confetti, device frames). | Invoke the `hyperframes-registry` skill and search it for the week's subjects before hand-building any of these. |
| 11 | This repository | What already exists and what the user said about it. | `reel/templates/*.md` (looks, approved or rejected), `reel/references/log.json` (never reuse a reference URL), `reel/lib/` (what the kit can draw), `reel/days/` (the daily-series worked examples: `2026-10-09` footage-based and posted, `2026-10-12` the slow night film, `2026-10-13` torn-paper collage with GIF stickers) and `reel/weeks/` (`2026-W44`: the arcade look, the first weekly reel and the first with pixelfx). |
| 12 | https://giphy.com/ | Reaction GIFs as stickers on the punchlines, when the user wants them. | `giphy.com/search/WORDS` lists `giphy.com/gifs/SLUG-ID` links; the clip is `media.giphy.com/media/ID/giphy.mp4`. Meme-original GIFs only, never clips from films, TV or cartoons. Loop each to about 9 s into `reel/media/WEEK/` and credit it. |
| 13 | **Gemini** (Nano Banana Pro, in Chrome; the user's Google AI Pro account) | **The cherry on top:** painted 9:16 frames made for this week's scenes (a hero frame for the big beat, a background plate, a stylised version of a place). | See 3f. Model **4 Argon**; with "same exact style as the previous image" one chat gave five matching 9:16 plates on 2026-11-04. |
| 14 | **pixelfx** (`reel/lib/pixelfx/`, MIT, from github.com/patch-gg/pixelfx) | **The animation layer of every reel** (3e): 244 pixel-art effects for the hits, wipes, ambience and rewards of each line (explosions for a crash, coin and gem pickups and level-ups for a record, lightning for a shock, rain, fog and god rays for the mood, iris and glitch wipes between shots, confetti for a beat). | Search `reel/lib/pixelfx/docs/CATALOG.md` for the week's subjects. Look before choosing: `node tools/render.mjs ID --zoom 3` in `reel/lib/pixelfx/` writes `records/ID/contact.png` (`--mp4` for motion). Try a `palette` (a `PAL` name such as `gold`, `poison`, `blood`, `cyber`, or hex colours) to match the grade. When none fits, write a new one in `src/fx/finance/` following `docs/AUTHORING.md` and `skill/SKILL.md` (render, look, refine at least three rounds; `node tools/check.mjs ID`), then `node tools/index.mjs` and `node build.mjs`. |
| 15 | **Openverse** (openverse.org, real recordings, mostly Freesound) | **Real sounds** for a role that should sound recorded rather than made (a coin into a slot, a real explosion, an electric crack, a crowd). | `python -m pipeline.openverse search "WORDS"` lists CC0 / PDM / CC BY recordings only (earshot's real-sound policy: no NC, ND or SA) with length and source; `python -m pipeline.openverse get NAME ID` saves `reel/sfx/openverse/NAME.wav` and its attribution in `reel/sound/openverse.json`. Shortlist by ear before using one (earshot `rank`, `find`, `realness`: 3g). Openverse's own `category=sound_effect` filter returns nothing; it is not used. |
| 16 | **earshot** (`D:/Projects/Experiments/earshot`, MIT; skills `earshot` and `real-sound` in `.claude/skills/`) | **Ears and made sounds:** listening (rank, find, realness, timeline, sheet), the made-in-code kit as the fallback library, and the critique of the finished reel against 7 professional launch films. | `python -m pipeline.sound kit` and `review WEEK` (3g). Its own Python: `D:/Projects/Experiments/earshot/.venv/Scripts/python.exe -m earshot ...` for anything else (`rank`, `find`, `match`, `realness`, `sfx list`, `measure`). |
| 17 | **real-sfx** (Clipwing, `.claude/skills/real-sfx`, MIT; its 78 CC0 UI sounds bundled) | **Which sound and where it lands:** picks real recordings from the library by measured character, places them frame-exact over the song, snaps hits to the beat, tunes tonal sounds to the song, and critiques the result. | Through `python -m pipeline.sound place / review WEEK` (3g). Its own tools from its folder with the pipeline's Python: `scripts/search.py --role whoosh --sheet x.png` (look at candidates), `scripts/sheet.py` (edit a placed sound), `scripts/taste.py ban ID` (never use a sound again). Library: `scripts/setup.py check`. |

"Skillry", named by the user on 2026-10-09, could not be identified (skillry.com is a parked domain). Ask
for its address at the start of the brainstorm and add it to the table.

Keep the table current: when the user names a new site, or one stops working or starts working, edit
its row and the "last checked" date.

### 3c. Look before choosing
- Download candidates into `reel/media/WEEK/` (footage) or the scratch folder (references), make a strip
  of frames from every clip, and look at it. Titles lie: a clip may open on black, the subject may sit at
  one edge of a wide frame.
- Prefer clips that will crop to 9:16 (subject near the middle, or a vertical clip), and have a spare for
  the lines that matter most.
- For the editing style, look at three or more candidate references side by side before picking one.

### 3d. Put the idea to the user
Write the plan and show it to them before building. Keep it short enough to read in a minute:

1. **The idea in two sentences:** what kind of reel this is and what it should feel like.
2. **The reference** for the editing style (name, link, why it fits), or the template if they chose Default.
3. **Line by line:** for each lyric line, the layered picture (background, middle, front: 3e), where each
   layer comes from, and the words or figure that sit on it.
4. **What each resource gave:** one line per row of the table: used for what, or nothing fitting, or not
   reachable and why.
5. **Gemini:** the frames to generate (how many; the account allows roughly 10 Pro images a day).
6. **Anything they must decide:** a choice between two directions, a line with no good picture.

Ask for a yes, or for changes. Build only after the yes. Save the plan as `reel/weeks/WEEK/plan.md`.

### 3e. The studio mix: every shot is layered
A shot is built from layers taken from different resources, then made one picture by one grade:

- **Background:** stock footage, a Gemini plate or a graded colour field.
- **Middle:** the subject: a stock clip cut out or framed, an illustration, a chart.
- **Front:** interface elements, registry blocks, a GIF sticker, the type of the line.
- **Animation: pixelfx with motion graphics.** The moving effects of the reel are pixelfx effects (`s.pfx`, row
  14), on every line: an effect on each hit word, a pixelfx wipe or a punch on each cut, an ambient loop
  (weather, critters, fireflies) under the quiet lines. The motion graphics (type, numbers, charts, interface,
  registry blocks) move with the kit's GSAP moves on top. Scale effects by whole numbers (3 to 10 px per
  effect pixel) so the pixels stay square, and recolour them to the reel's palette.
- **One grade over all of it:** the same paper or grain, vignette and colour look on every layer, moving
  with the week's mood, so footage, paint and interface read as one world.
- **Depth and life:** the layers drift at different speeds (parallax), the camera is never locked off,
  hits land on the bar grid with a shake or flash, and something moves in every frame.
- **Sound:** every moving element records its cue; the sounds are placed on those cues and levelled over the song by `pipeline.sound` (3g), never mixed into the song file.

### 3f. Gemini frames
- Work in Chrome at gemini.google.com with the model set to **Pro** and the aspect to **9:16** (16:9 for a
  wide plate that is panned). Keep one chat per week, with the first frame or a character sheet attached as
  the style reference, so every frame matches.
- Prompt for what code and footage cannot give: a painted place, a symbolic image, a backdrop.
  Say "no people, no text, no watermark" unless a figure
  is wanted.
- **Downloading:** use Gemini's Library page (sidebar "Library", Media, newest first): open each image and
  click the viewer's download button; it saves the right original (768x1376 for 9:16) to Downloads as
  `Gemini_Generated_Image (N).jpeg`, no dialog (2026-11-04). The chat's "Download full size" buttons save
  the wrong image. Download in the order you will name them.
- Then `python -m pipeline.plates WEEK NAME [NAME ...]`: it takes the newest downloads in order, keeps the
  originals, scales each to fill 1080x1920 into `reel/media/WEEK/plates/` and writes `plates_sheet.jpg`.
  Look at the sheet before building on them.
- Veo can animate one hero shot if the quota allows; ask first.

### 3g. Sound design: the picture says where, real-sfx places real recordings, earshot judges
Every sound is caused by something on screen and sits on the frame the picture code computed, not on a time
typed by hand. The song is the music and is never changed: nothing ducks it, nothing re-gains the mix. Three
tools, one job each (skills in `.claude/skills/`: `real-sfx` for the craft of picking and placing, `earshot` for
listening, `real-sound` for the wider rules of a launch film's sound):

1. **Where: cues from the picture.** Every move in the kit records a cue (`R.cue` in `reel/lib/kit.js`): a slam
   is a `hit` on its landing frame, a pop at half its travel, a side-throw a `whoosh` on its velocity peak, a
   number's lock a `tick`, pixelfx hits by category (`impact`, `zap`, `coin`, `burst`), a world's opening flash a
   `whoosh`, glitch type a `glitch`, the CRT off a `switch`, shot cuts a silent `cut`. A scene can add its own:
   `R.cue(t, kind, { weight })`. After the render, `python -m pipeline.sound cues WEEK` builds the page in
   headless Chrome and writes `reel/weeks/WEEK/cues.json`.
2. **Which sound: real recordings.** The library is real one-shots from Openverse (row 15), sorted by type in
   `reel/sfx/library/` with a `catalog.json`; `python -m pipeline.openverse library` fills it from
   `reel/sound/library.json` (add a search or raise a count and run it again). earshot's kit (made in code,
   `reel/sound/kit.json`; `python -m pipeline.sound kit`) is registered with real-sfx as a fallback library, used
   only where the real library has fewer than three fitting sounds. `reel/sound/design.json` maps each cue kind
   to a real-sfx kind and a gain, and caps the density (12 in any 10 s, heaviest cues first; hard cuts silent);
   a week overrides any key in `reel/weeks/WEEK/sound.json`.
3. **Placed: real-sfx.** `python -m pipeline.sound place WEEK` runs real-sfx's `from_cues.py` and `mix.py` on the
   plain render: each sound on its frame by its audible start or arrival, hits nudged onto the song's beat when
   within 50 ms (only if the beat grid lands on the kicks), tonal sounds (coins, chimes, pops) tuned to the song's
   notes, the effects dipped lightly under the voice. `output/WEEK/reel.mp4` becomes the reel with the effects;
   the plain render stays as `output/WEEK/sound/base.mp4`, the effects alone as `reel_sfx_sfx_track.wav`, what was
   dropped and why in `dropped.json`. To audition one moment's candidates, use real-sfx's own `search.py` with
   `--sheet` (a picture of each), and earshot (`rank`, `find`, `realness`, row 16) on the files.
4. **Judged: both critics.** `python -m pipeline.sound review WEEK` writes `output/WEEK/sound/`: real-sfx's
   `critique_real_sfx.md` (scores for hook, sync, coverage, pacing, variety, hierarchy, balance, loudness, mono,
   and the five moments to listen to, cut into `listen.wav`) and earshot's `earshot_timeline.txt` (sync per cue
   against chance), `earshot_sheet.png` (open it: cue markers green within a frame, amber within 100 ms, red with
   no sound) and `earshot_critique.txt` (a scorecard against 7 professional launch films). Fix the three worst
   (design kinds and gains, the density, a cue's weight, a library sound: `taste.py ban ID` in real-sfx), place
   and review again. At least two rounds. Report the numbers and send the user `listen.wav`: neither tool has ears,
   and the user's verdict decides.

## 4. Build the reel

1. Copy the reference into `reel/references/` (keep the file small; trim with FFmpeg if it is long).
2. Study it: extract frames with FFmpeg (a contact sheet at 6 to 10 fps shows the motion) and note the
   grounds and palette, type, motion vocabulary, pacing and signature moves.
3. Invoke the `hyperframes` skill for the composition rules before writing scenes.
4. Fetch the footage the plan lists and write `reel/weeks/WEEK/footage.json` (see `reel/templates/slap.md`,
   "Over footage"). `pipeline.video` cuts the clips and places them under the scenes. Copy the credits of
   the clips used into `reel/weeks/WEEK/credits.json`.
5. Write the week's scenes in `reel/weeks/WEEK/` as `1-name.js`, `2-name.js`, ... (they run in file-name
   order). `reel/lib/` is the kit:
   - `kit.js`: `R.shot({ caps, ground }, (s) => ...)`, rows of fitted type, captions, the moves in `R.fx`.
     The `clear` ground paints nothing, so the footage shows through the shot.
   - `s.pfx(ID, { at, x, y, scale, palette, front })` (`pfx.js`): a pixelfx effect whose own t = 0 lands at `at`
     (song seconds), its anchor at `x, y` of the frame; `fit: "cover"` fills the frame (weather, wipes);
     `act: true` plays a move with pixelfx's stock character and its wind-up. Seek-safe: a frame is the same
     however it is reached.
   - `slap.js`: bold type in four voices and interface elements (`R.slap.ui`) over stock footage.
   - `film.js`: a slow night film for a sung song. `circuit.js`, `windows.js`, `pixel.js`, `ink.js`,
     `collage.js`, `stitch.js` (folk look, only when asked): the other looks.
   - Every time comes from the week's timeline: `s.w(line, word)`, `s.cap(line)`. Never hard-code a second.
   - A new look that the kit cannot do gets a new module in `reel/lib/`, added to `reel/index.html`.
6. `.venv\Scripts\python.exe -c "from pipeline.video import *; prepare(Episode(OUTPUT_DIR, 'WEEK'))"`, then
   in `reel/`: `npx hyperframes check .` and `npx hyperframes snapshot . --at <times>`. Review in three
   passes before rendering: a contact sheet of every shot (does each read from its frame alone?), frame
   strips of every fast moment (takes, hits, transitions: no pops), and close crops (`--zoom`) of faces,
   hands, props and contacts. Fix what is wrong, then look again.
7. Render: `.venv\Scripts\python.exe -m pipeline.video WEEK`. It writes `output/WEEK/reel.mp4` and checks
   it is 1080x1920, 60 fps, yuv420p, has audio and lasts as long as the song.
8. Sound (3g): `python -m pipeline.sound cues WEEK`, `place WEEK`, `review WEEK`; read both critiques, open
   `earshot_sheet.png`, fix the three worst, place and review again.

Rules that hold for every reel: 1080x1920 at 60 fps; the first frame is not blank. Text (type, the lyric
caption, the figures pixelfx effects draw) stays inside the cautious vertical-video safe area: out of the top
288 px, the bottom 672 px and the right 192 px (the left 48 px too); graphics without text may run into the
margins. The arcade look's stage and caption already sit there (`reel/index.html`). Never put a sub-line under
a figure that only repeats the caption, and keep a figure on screen long enough to read (carry it into the next
shot if its line is short).

After the render and the sound, review the reel with the `video-review` skill (`.claude/skills/video-review`,
Ablation-Lab/video-review-tool): run its `review-video.ps1` on `output/WEEK/reel.mp4` with
`-Narration output/WEEK/subtitles.srt -SceneThreshold 0.3`, skim the report as the skill says (open the frames
it flags and one built frame per shot; checks are leads, confirm each in the frame), fix what is real without
adding cuts, render, place the sound again and review again. The tool's number check needed one fix for large
figures (`review-checks.ps1` line 388, a [double]); keep it if the skill is updated.

Rules the user set (2026-10-11 to 2026-11-04):
- **Pictures, not only words.** Footage, illustrations, interface elements or Gemini frames on every
  line. A video that only sets the lyrics as type was rejected.
- **Full 9:16.** The picture fills the whole frame in every shot.
- **Clean corners.** No name, week number, date, BPM, timecode, chapter label or progress line.
- **The song's musical form stays in the song.** Do not theme the video after it, and never write its name
  on screen, in the lyrics or in the description. Check `output/WEEK/caption.txt` for it too.
- **pixelfx for the animation** (2026-11-04): every reel's animation is pixelfx effects together with
  motion graphics (3e).
- **No picture twice** (2026-11-04): never reuse a frame, plate, clip or shot within one reel. Every shot
  gets its own background; a returning hook gets new pictures. Check the plan (3d) for repeats before the yes.
- **When a look is rejected, ask before rebuilding:** which direction they want. Do not guess twice.

## 5. Record it

- Append to `reel/references/log.json`: `date` (the week), `source` (`user`, `default` or `search`),
  `reference` (file in `reel/references/` and the URL if there is one) and `template`.
- If the look is new, add `reel/templates/NAME.md` in the same shape as the existing ones. If the user
  rejected a look, say so in its template.
- If a resource behaved differently from its row in section 3, update the row.
- Run `.venv\Scripts\python.exe -m pipeline.instagram WEEK --draft`. It copies the reel into
  `instagram/posts/WEEK/` with a first caption and `post.json` marked `draft`, and posts nothing.
- Tell the user the path of the reel, the reference and template used, and what was checked. Say plainly
  that you have not watched it with sound.
- If the reel uses stock footage, GIFs or interface elements by others, say where they came from and that
  the description must credit them.

## 6. Post to Instagram (only after approval)

Posting is public and cannot be undone from here. Never post on your own initiative, and never treat an
earlier approval as covering a new reel.

1. After reporting the reel, ask the user to watch it and say whether to post it. Stop there.
2. When they approve the reel, write the Instagram description and show it to them in full:
   - Start from `output/WEEK/caption.txt` (it is fact-checked with the song). Lead with the week's hook in
     one line, then the two or three key figures, then `Not financial advice.`
   - Every number must come from the week's news file. Do not add claims the song did not make.
   - If the reel uses stock footage (`reel/weeks/WEEK/credits.json` exists), add the attribution line
     its licence requires, such as "Stock footage: Vecteezy.com".
   - End with 5 to 8 relevant hashtags. Stay under 2,200 characters.
3. Pick a cover: a second of the reel where the week's main word or number is
   fully on screen, and set it as `cover_at_seconds` in `instagram/posts/WEEK/post.json`.
4. Save the description as `instagram/posts/WEEK/caption.txt` and ask the user to approve the description
   (they may edit that file). Post only on an explicit yes to that text.
5. Post: `.venv\Scripts\python.exe -m pipeline.instagram WEEK`. It hosts the reel on the user's Vercel Blob
   store for Instagram to fetch, publishes it with `caption.txt` through Meta's API, deletes the hosted copy
   and marks `post.json` as `posted` with the link. A posted week is refused unless `--again` is given,
   which needs its own approval.
6. Give the user the link. If it fails, report Meta's message as it is; do not retry more than once.

`python -m pipeline.instagram --check` tests the credentials without posting. Run it before asking for
approval of the description: on 2026-10-14 the token had expired. If it fails, or
`INSTAGRAM_ACCESS_TOKEN` is missing from `config/.env`, tell the user what to add (README, "Posting to
Instagram") and stop.
