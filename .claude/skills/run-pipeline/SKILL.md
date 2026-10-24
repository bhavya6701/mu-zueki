---
name: run-pipeline
description: Use when asked to run the Mu-Zueki pipeline, make today's reel, build or redo a day's video, or run the whole thing for a date. Covers the song stages, asking for the reference video, brainstorming the video across every resource site, writing the day's scenes and rendering the reel.
---

# Run the Mu-Zueki pipeline

The pipeline makes one reel per news day: a song (Python, `pipeline/`), then a video (HyperFrames, `reel/`).
The song stages run on their own; the video needs a reference, a brainstorm and scene writing, so it is done here.

The order is fixed: **song, ambience (when the song is set in a place), reference question, brainstorm
across every resource, the user's yes to the idea, build, record, post.** The 2026-10-09 reel was built four times because the brainstorm and the yes
were skipped; do not skip them.

## 1. Song stages

Run `.venv\Scripts\python.exe -m pipeline --date YYYY-MM-DD` for the day the user named (without
`--date` it uses the newest news file). It skips finished stages. Read `output/DATE/status.json` afterwards.

- If `raw_data/us_finance_news_DATE.json` does not exist, the run first gathers that day's top ten
  stories from the web and fact-checks them (`pipeline/news.py`; about 10 to 20 minutes, no ElevenLabs
  credits). Read the new file's `metadata.limitations` and tell the user what was dropped or weakened.
  If it refuses the day (market not closed, too few stories survive), report that and stop.

- The audio stage is the only one that spends ElevenLabs credits. If the day has no `audio.mp3` yet, say
  so before running.
- If the user asks for a different kind of song (structure, voices, sound) or to redo a day's song:
  copy `output/DATE/` to `output/_archive/` first, write or pick a brief in `prompts/briefs/`, and run
  `--from song --brief FILE [--vocal both] --stop-after song`. Read `song.md` (do the lyrics follow the
  brief and the news?) before running the audio. A new song means the day's scenes must be rewritten.
  You cannot hear the result: check `audio.json` (words heard per section) and say so.
- If the user likes a song's music, beat and flow but not its voice, do not regenerate it (a new take
  changes the music too). Run `python -m pipeline.revoice DATE VOICE_ID`: it splits the track, converts
  only the vocal to another ElevenLabs voice, lowers and compresses it and mixes it back over the same
  instrumental, so word timings and the timeline stay valid. `--voices` lists the voices; `--out NAME`
  writes a trial mix beside the original for comparing. It spends credits (about 250 per conversion on
  2026-10-11). Expect the listening check to hear fewer words than before, and say by how much.
- `--length 30|45|60` sets one run's reel length. `prompts/briefs/slow-melodic.md` is the slow, sung,
  many-instrument song set in one place (used on 2026-10-12, with `--vocal male --length 60`).
- If a stage is `failed`, stop and report it. If it is `needs_review`, report the reason and carry on only
  if the user agrees.

## 1b. Ambience (before any video work)

When the user asks for ambience, or the brief put a `PLACE:` line at the top of the song's reel notes,
put the song in that place before the video is started: `AMBIENCE.md` has the guidelines and the table
of spaces.

- `.venv\Scripts\python.exe -m pipeline.ambience DATE --space NAME` (`--spaces` lists them; `--bed sfx
  --prompt "..."` generates the room tone with ElevenLabs instead of building it from noise). It splits
  the song into stems, which spends ElevenLabs credits once per day: say so before running.
- Keep it subtle: the user's rule is that the ambience must never affect the song or make the voice
  sound artificial. Read `output/DATE/ambience/ambience.json` afterwards (words heard before and after,
  level before and after) and report it. You cannot hear it; say so.
- Word timings do not move, so the subtitles and timeline stay valid. `output/DATE/ambience/original.mp3`
  is the untouched song.
- The video is then set in the same place: name the place and the space in the plan (3d), and look for
  footage of that place in the sweep.

- Before building, check the phrase onsets against the vocal stem and correct `timeline.json` where Whisper
  placed a line early (`reel/templates/film.md`, "Sync"). On 2026-10-12 five lines were off by 0.2 to 1.5 s.

## 2. Ask for the reference (always)

Before any video work, ask the user with AskUserQuestion. Never skip this, and never pick for them:

| Option | What it means |
|--------|---------------|
| My own video | The user gives a file path or URL. |
| Default | A random template from `reel/templates/`, but not the one used for the newest entry in `reel/references/log.json`, and not one marked `Default pool: no`. |
| Search yourself | Find a new reference that fits the day, as part of the brainstorm below. |

Whatever they answer, the brainstorm in section 3 still happens: the reference sets the editing style,
the brainstorm decides what is in the picture.

## 3. Brainstorm the video across every resource (always)

The user gave the resource sites so that the reel is built from them. Before writing any scene, go
through **every row** of the table below, with the day's song in hand, and collect what each one offers
for this day. Do not stop at the first site that returns something, and do not build from memory.

### 3a. Read the day
Read `output/DATE/song.md` and `timeline.json`: the stories, the mood, the BPM, the lyric lines and their
times, and the reel notes. Write down, line by line, what the line says and what could be seen while it
is sung (a place, a thing, an action, a number, a company).

### 3b. Sweep the resources
For each row: open it the way the row says, search it for the day's subjects, and note what you found
(or that it could not be reached, and why). Several sites answer only to a real browser, so check the
Chrome extension first (`list_connected_browsers`): the user has it installed and signed in, and it was
connected on 2026-10-14. If it shows no browser, ask them to open Chrome. A site that still cannot be
reached must be named in the plan, not dropped silently.

| # | Resource | What to look for in the brainstorm | How to reach it (last checked 2026-10-14) |
|---|----------|------------------------------------|-------------------------------------------|
| 1 | https://www.vecteezy.com/free-videos | **Footage for each lyric line.** Search every subject from 3a (two or three wordings each). | `python -m pipeline.stock search "WORDS"` lists the free clips; `python -m pipeline.stock get DATE NAME ID-SLUG` downloads one (up to 2560x1440) and records its credit. Paid ("Pro") clips are skipped. Searches of three or more words usually 404: use two words. More than two downloads at once get HTTP 429: fetch one at a time with a pause. The free licence requires attribution in the post. |
| 2 | https://dareful.com/ | Free 4K camera footage (cities, nature, weather, crowds) for lines the first site cannot cover. | Behind a bot check ("Performing security verification"). On 2026-10-14 it did not clear even in the user's Chrome through the extension. Never try to get past the check yourself: ask the user to open the site once in that Chrome and pass it, then retry; if it still blocks, list it as unreachable. |
| 3 | https://www.magnific.com/videos | Stock and generated video; look for the stylised or impossible shot (a symbol, a metaphor). | Refuses plain fetches (HTTP 403) but opens in the user's Chrome through the extension (checked 2026-10-14; the page calls itself "Magnific (formerly Freepik)"). Many clips are marked Premium: use only the free ones, and check the licence of anything taken. On 2026-10-14 all 50 results for "gas station night" were Premium, and so were all for "wall street"; "torn paper" had a few free green-screen paper-tear clips. |
| 4 | https://getillustrations.com/ | Illustration packs: a consistent set of drawn figures or objects for a reel that is illustrated, or for cut-outs over footage. | `curl` with a browser user agent. Check each pack's licence; note which packs are free (`/free-illustrations`). Mostly doodle and character packs: nothing for a photographic reel (2026-10-14). Not used in a reel yet. |
| 5 | https://uiverse.io/ | Interface elements that can act out a line: toggles, sliders, notifications, loaders, cards, buttons, patterns. | The whole library is the Git repository `uiverse-io/galaxy` (one HTML file per element, MIT): clone it shallow into the scratch folder and `grep` for the day's words (signal, wifi, call, price, lock, heart, weather...). Their CSS loops cannot be seeked by a render: rebuild the element on the GSAP timeline (`reel/lib/slap.js` has a set) and credit the author. |
| 6 | https://whatships.com/ | **Editing-style references.** About 2,400 launch and motion films. | `curl` works. `sitemap.xml` lists every `/videos/NAME/`; `/videos/category/motion/` and `/design/` are the non-product ones. Each item page has a `video.twimg.com` MP4 link (grep for `.mp4`) and an `og:image` poster: fetch the posters of 15 or so candidates first, download only the one or two that fit, one at a time. |
| 7 | YouTube, Vimeo | Editing-style references that are not product films: music-video edits, kinetic typography, mixed-media edits, title sequences. | `yt-dlp` in a scratch virtual environment (`python -m venv`, `pip install yt-dlp`; `ytsearch8:WORDS` lists results), at 480p; keep only a short excerpt in `reel/references/`. |
| 8 | https://recent.design/ | Recent motion and interface studies, for a transition or a layout idea. | `curl` with a browser user agent; the feed is built by scripts, so use the browser tools to read items. |
| 9 | https://land-book.com/, https://www.lapa.ninja/ | Landing pages with motion, for a palette, a type pairing or a layout. land-book has a "Motion" section; lapa.ninja features Showreel.Design, an archive of motion-design reels worth opening for editing-style references. | Refuse plain fetches (HTTP 403). land-book opened in the user's Chrome through the extension on 2026-10-14 for one session, but in a later session the same day the extension had no permission to read it: ask the user to allow the site in the extension, or list it as unreachable. |
| 10 | HyperFrames registry | Ready-made blocks and effects (charts, maps, glitch, grain, transitions, confetti, device frames). | Invoke the `hyperframes-registry` skill and search it for the day's subjects before hand-building any of these. |
| 11 | This repository | What already exists and what the user said about it. | `reel/templates/*.md` (looks and what was approved or rejected), `reel/references/log.json` (never reuse a reference URL), `reel/lib/` (what the kit can already draw), `reel/days/` (worked examples; `2026-10-09` is the footage-based one the user posted; `2026-10-12` is the slow night film; `2026-10-13` is the torn-paper collage with GIF stickers). |
| 12 | https://giphy.com/ | Reaction GIFs as stickers on the punchlines, when the user wants them (added 2026-10-14). | Plain fetch works: `giphy.com/search/WORDS` lists `giphy.com/gifs/SLUG-ID` links; the clip is `media.giphy.com/media/ID/giphy.mp4`. Look at a strip of each before choosing. The user approved meme-original GIFs only, not clips from films, TV or cartoons; ask again if in doubt. Loop each to about 9 s into `reel/media/DATE/` and credit it (`reel/templates/collage.md`, "GIFs"). |

"Skillry", named by the user on 2026-10-09, could not be identified (skillry.com is a parked domain). Ask
for its address at the start of the brainstorm and add it to the table.

Keep the table current: when the user names a new site, or one stops working or starts working, edit
its row and the "last checked" date.

### 3c. Look before choosing
- Download candidates into `reel/media/DATE/` (footage) or the scratch folder (references), make a strip
  of frames from every clip, and look at it. Titles lie: a "cell tower" may be a rendering, a clip may
  open on black, the subject may sit at one edge of a wide frame.
- Prefer clips that will crop to 9:16 (subject near the middle, or a vertical clip), and have a spare for
  the lines that matter most.
- For the editing style, look at three or more candidate references side by side before picking one.

### 3d. Put the idea to the user
Write the plan and show it to them before building. Keep it short enough to read in a minute:

1. **The idea in two sentences:** what kind of reel this is and what it should feel like.
2. **The reference** for the editing style (name, link, why it fits), or the template if they chose Default.
3. **Line by line:** for each lyric line, the picture (clip, illustration or element, and where it comes
   from) and the words or figure that sit on it.
4. **What each resource gave:** one line per row of the table: used for what, or nothing fitting, or not
   reachable and why.
5. **Anything they must decide:** a choice between two directions, a line with no good picture.

Ask for a yes, or for changes. Build only after the yes. Save the plan as `reel/days/DATE/plan.md`, so a
later session can see what was agreed.

## 4. Build the reel

1. Copy the reference into `reel/references/` (keep the file small; trim with FFmpeg if it is long).
2. Study it: extract frames with FFmpeg (a contact sheet at 6 to 10 fps shows the motion) and note the
   grounds and palette, type, motion vocabulary, pacing and signature moves.
3. Invoke the `hyperframes` skill for the composition rules before writing scenes.
4. Fetch the footage the plan lists and write `reel/days/DATE/footage.json` (see
   `reel/templates/slap.md`, "Over footage": which clip sits under which lyric line, where it starts in
   the source, how it is cropped and graded). `pipeline.video` cuts the clips and places them under the
   scenes. Copy the credits of the clips used into `reel/days/DATE/credits.json`.
5. Write the day's scenes in `reel/days/DATE/` as `1-name.js`, `2-name.js`, ... (they run in file-name
   order). `reel/days/2026-10-09/` is the worked example for footage with type and elements over it;
   `reel/lib/` is the kit:
   - `kit.js`: `R.shot({ caps, ground }, (s) => ...)`, rows of fitted type, captions, the moves in `R.fx`.
     The `clear` ground paints nothing, so the footage shows through the shot.
   - `slap.js`: the slap look (`R.slap`): bold type in four voices and interface elements (`R.slap.ui`)
     over stock footage, or on flat colour.
   - `stitch.js`: the stitch look (`R.st`): the frame as an embroidered cloth, drawn in one SVG per
     shot. Only when the user asks for a folk look.
   - `film.js`: the film look (`R.film`): a slow night film for a sung song. Serif lyric over graded footage,
     drawn rain and grain, held words set large, figures on a signboard, a counter or a card.
   - `circuit.js`: the circuit look and its pastel idol twin (`R.cir`, `R.cir.idol`).
   - `windows.js`: the windows look (`R.win`: frames, glyph cards, tables, meters, charts, cursor).
   - `pixel.js`: pixel-art sprites. `ink.js`: pen lines (`s.zip`, `s.carry`, `s.whip`, `s.ring`, `s.guides`).
   - Every time comes from the day's timeline: `s.w(line, word)`, `s.cap(line)`. Never hard-code a second.
   - A new look that the kit cannot do gets a new module in `reel/lib/`, added to `reel/index.html`.
6. `.venv\Scripts\python.exe -c "from pipeline.video import *; prepare(Day(OUTPUT_DIR, 'DATE'))"`, then
   in `reel/`: `npx hyperframes check .` and `npx hyperframes snapshot . --at <times>`. Look at the
   contact sheets and fix what is wrong before rendering.
7. Render: `.venv\Scripts\python.exe -m pipeline.video DATE`. It writes `output/DATE/reel.mp4` and
   checks it is 1080x1920, 60 fps, yuv420p, has audio and lasts as long as the song.

Rules that hold for every reel: 1080x1920 at 60 fps; nothing important in the top 230 px or bottom
420 px (the platform covers them); text inside the middle 80% of the width; the first frame should not
be blank.

Rules the user set while rejecting versions of the 2026-10-09 reel (2026-10-11 to 2026-10-13):
- **Pictures, not only words.** A reel needs footage, illustrations or interface elements from the
  resource sites for every line. A video that only sets the lyrics as type was rejected ("I don't want
  just the rap content stated in video format - have some visuals").
- **Full 9:16.** The picture fills the whole frame in every shot. Do not stack the content in a block
  in the middle with empty ground above and below.
- **Clean corners.** No name, tape number, date, BPM, timecode, chapter label or progress line.
- **The song's musical form stays in the song.** Do not theme the video after it (a folk-embroidery
  video for a Gujarati bardic song was rejected), and never write its name on screen, in the lyrics or
  in the description. Check `output/DATE/caption.txt` for it too: the song stage once wrote "as a
  sapakhru" into the caption.
- **When a look is rejected, ask before rebuilding:** which direction they want, together with the
  reference question. Do not guess twice.

## 5. Record it

- Append to `reel/references/log.json`: `date`, `source` (`user`, `default` or `search`), `reference`
  (file in `reel/references/` and the URL if there is one) and `template`.
- If the look is new, add `reel/templates/NAME.md` in the same shape as the existing ones, so the default
  option can pick it in future. If the user rejected a look, say so in its template.
- If a resource behaved differently from its row in section 3 (blocked, opened up, a better way in),
  update the row.
- Run `.venv\Scripts\python.exe -m pipeline.instagram DATE --draft`. It copies the reel into
  `instagram/posts/DATE/` with a first caption and `post.json` marked `draft`, and posts nothing.
- Tell the user the path of the reel, what reference and template were used, and what was checked. Say
  plainly that you have not watched it with sound.
- If the reel uses stock footage, say where it came from and that the description must credit it.

## 6. Post to Instagram (only after approval)

Posting is public and cannot be undone from here. Never post on your own initiative, and never treat an
earlier approval as covering a new reel.

1. After reporting the reel, ask the user to watch it and say whether to post it. Stop there.
2. When they approve the reel, write the Instagram description and show it to them in full:
   - Start from `output/DATE/caption.txt` (it is fact-checked with the song). Lead with the day's hook in
     one line, then the two or three key figures, then `Not financial advice.`
   - Every number must come from the day's news file. Do not add claims the song did not make.
   - If the reel uses stock footage (`reel/days/DATE/credits.json` exists), add the attribution line
     its licence requires, such as "Stock footage: Vecteezy.com".
   - End with 5 to 8 relevant hashtags. Stay under 2,200 characters.
3. Pick a cover: a second of the reel where the day's main word or number is fully on screen (never a
   blank or half-drawn frame), and set it as `cover_at_seconds` in `instagram/posts/DATE/post.json`.
   Tell the user which frame it is.
4. Save the description as `instagram/posts/DATE/caption.txt` and ask the user to approve the description (they may
   edit that file). Post only on an explicit yes to that text.
5. Post: `.venv\Scripts\python.exe -m pipeline.instagram DATE`. It puts the folder's `reel.mp4` on
   the user's Vercel Blob store for Instagram to fetch, publishes it with `caption.txt` through Meta's
   official API, deletes the hosted copy, and marks
   `post.json` as `posted` with the link. A posted day is refused unless `--again` is given, which
   needs its own approval.
6. Give the user the link. If it fails, report Meta's message as it is; do not retry more than once.

`python -m pipeline.instagram --check` tests the credentials without posting. Run it before asking for
approval of the description: on 2026-10-14 the token had expired and posting failed at that step. If it
fails, or `INSTAGRAM_ACCESS_TOKEN` is missing from `config/.env`, tell the user what to add (README,
"Posting to Instagram") and stop.
