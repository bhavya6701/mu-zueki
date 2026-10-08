---
name: run-pipeline
description: Use when asked to run the Mu-Zueki pipeline, make today's reel, build or redo a day's video, or run the whole thing for a date. Covers the song stages, asking for the reference video, writing the day's scenes and rendering the reel.
---

# Run the Mu-Zueki pipeline

The pipeline makes one reel per news day: a song (Python, `pipeline/`), then a video (HyperFrames, `reel/`).
The song stages run on their own; the video needs a reference and scene writing, so it is done here.

## 1. Song stages

Run `.venv\Scripts\python.exe -m pipeline --date YYYY-MM-DD` for the day the user named (without
`--date` it uses the newest news file). It skips finished stages. Read `output/DATE/status.json` afterwards.

- If `raw_data/us_finance_news_DATE.json` does not exist, the run first gathers that day's top ten
  stories from the web and fact-checks them (`pipeline/news.py`; about 10 to 20 minutes, no ElevenLabs
  credits). Read the new file's `metadata.limitations` and tell the user what was dropped or weakened.
  If it refuses the day (market not closed, too few stories survive), report that and stop.

- The audio stage is the only one that spends ElevenLabs credits. If the day has no `audio.mp3` yet, say
  so before running.
- If a stage is `failed`, stop and report it. If it is `needs_review`, report the reason and carry on only
  if the user agrees.

## 2. Ask for the reference (always)

Before any video work, ask the user with AskUserQuestion. Never skip this, and never pick for them:

| Option | What it means |
|--------|---------------|
| My own video | The user gives a file path or URL. |
| Default | A random template from `reel/templates/`, but not the one used for the newest entry in `reel/references/log.json`. |
| Search yourself | Find a new motion-graphics reference that fits the day (below). |

### Searching yourself

1. Read `output/DATE/song.md` for the stories, mood, BPM and reel notes. The reference must fit that
   content, theme and beat (fast and hard for an angry 140 BPM day, calmer for a reflective one).
2. Browse https://whatships.com/, https://land-book.com/, https://recent.design/ and
   https://www.lapa.ninja/, and follow through to the sites they feature. Wanted: designed, animated
   motion (kinetic type, illustrated or generated graphics, UI motion). Not wanted: camera footage.
3. Skip anything whose URL is already in `reel/references/log.json`. Every search must end on a
   reference that has not been used before.
4. Fetch the video with `npx hyperframes capture <url> -o <scratch dir>`, then
   `npx hyperframes capture --video <scratch dir> --list` and `--index N` to download it.
   What worked on 2026-10-08: whatships.com item pages (`/videos/NAME/`) carry a direct
   `video.twimg.com` MP4 link in their HTML (`curl` the page and grep for `.mp4`), and recent.design
   lists motion studies. land-book.com and lapa.ninja refused plain fetches (HTTP 403); use the browser
   tools for those.
5. If nothing usable can be downloaded, say so and ask the user again. Do not fall back to the default
   silently.

## 3. Build the reel

1. Copy the reference into `reel/references/` (keep the file small; trim with FFmpeg if it is long).
2. Study it: extract frames with FFmpeg (a contact sheet at 6 to 10 fps shows the motion) and note the
   grounds and palette, type, motion vocabulary, pacing and signature moves.
3. Invoke the `hyperframes` skill for the composition rules before writing scenes.
4. Write the day's scenes in `reel/days/DATE/` as `1-name.js`, `2-name.js`, ... (they run in file-name
   order). Use `reel/days/2026-10-07/` as the worked example and `reel/lib/` for the kit:
   - `kit.js`: `R.shot({ caps, ground }, (s) => ...)`, rows of fitted type, captions, the moves in `R.fx`.
   - `windows.js`: the windows look (`R.win`: frames, glyph cards, tables, meters, charts, cursor).
   - `pixel.js`: pixel-art sprites. `ink.js`: pen lines (`s.zip`, `s.carry`, `s.whip`, `s.ring`, `s.guides`).
   - Every time comes from the day's timeline: `s.w(line, word)`, `s.cap(line)`. Never hard-code a second.
   - A new look that the kit cannot do gets a new module in `reel/lib/`, added to `reel/index.html`.
5. `.venv\Scripts\python.exe -c "from pipeline.video import *; prepare(Day(OUTPUT_DIR, 'DATE'))"`, then
   in `reel/`: `npx hyperframes check .` and `npx hyperframes snapshot . --at <times>`. Look at the
   contact sheets and fix what is wrong before rendering.
6. Render: `.venv\Scripts\python.exe -m pipeline.video DATE`. It writes `output/DATE/reel.mp4` and
   checks it is 1080x1920, 60 fps, yuv420p, has audio and lasts as long as the song.

Rules that hold for every reel: 1080x1920 at 60 fps; nothing important in the top 230 px or bottom
420 px (the platform covers them); text inside the middle 80% of the width; the first frame should not
be blank.

## 4. Record it

- Append to `reel/references/log.json`: `date`, `source` (`user`, `default` or `search`), `reference`
  (file in `reel/references/` and the URL if there is one) and `template`.
- If the look is new, add `reel/templates/NAME.md` in the same shape as the existing ones, so the default
  option can pick it in future.
- Run `.venv\Scripts\python.exe -m pipeline.instagram DATE --draft`. It copies the reel into
  `instagram/posts/DATE/` with a first caption and `post.json` marked `draft`, and posts nothing.
- Tell the user the path of the reel, what reference and template were used, and what was checked. Say
  plainly that you have not watched it with sound.

## 5. Post to Instagram (only after approval)

Posting is public and cannot be undone from here. Never post on your own initiative, and never treat an
earlier approval as covering a new reel.

1. After reporting the reel, ask the user to watch it and say whether to post it. Stop there.
2. When they approve the reel, write the Instagram description and show it to them in full:
   - Start from `output/DATE/caption.txt` (it is fact-checked with the song). Lead with the day's hook in
     one line, then the two or three key figures, then `Not financial advice.`
   - Every number must come from the day's news file. Do not add claims the song did not make.
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

`python -m pipeline.instagram --check` tests the credentials without posting. If `INSTAGRAM_ACCESS_TOKEN`
is missing from `config/.env`, tell the user what to add (README, "Posting to
Instagram") and stop.
