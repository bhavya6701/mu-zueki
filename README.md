# Mu-Zueki weekly reel

Turns a week's US finance news into a hip hop reel and posts it, once a week after Friday's close:

1. **News:** the week's top ten stories (Monday to Friday) are gathered from the web and fact-checked.
2. **Song:** Claude writes it, ElevenLabs generates it, and the captions are timed from what was sung.
3. **Video:** a layered, studio-style reel is designed from a reference video and built in HyperFrames from
   stock footage, illustrations, interface elements and Gemini-painted frames, animated with pixelfx
   pixel-art effects and motion graphics.
4. **Instagram:** once you approve the reel, it is posted with a description.

A week is named by its ISO week, such as `2026-W44` (Monday 26 to Friday 30 October 2026).
Setting this up on a new machine: see `SETUP.md`.

## Layout
```
run_weekly.cmd           run it by hand (double-click)
config/settings.json     your settings; reused until you change them
config/.env              your keys (copy config/.env.example); never committed
prompts/                 persona.md (the artist), elevenlabs_format.md (how the song is laid out), news_research.md,
                         briefs/ (optional one-run steers for the song, used with --brief)
raw_data/                us_finance_news_week_WEEK.json: the week's news, gathered by the pipeline or dropped in by hand
pipeline/                the code
  news.py                gathers and fact-checks a week's news
  stages/song.py         1. Claude writes the song; it is checked and fact-checked
  stages/audio.py        2. ElevenLabs generates it; Whisper listens to every take
  stages/subtitles.py    3. captions are timed from what was actually sung
  revoice.py             gives a finished song another voice over the same music
  ambience.py            puts a finished song in a place (room, reverb, room tone); see AMBIENCE.md
  plates.py              brings Gemini-painted frames into a week's reel
  sound.py               the reel's sound effects: cues from the picture, real sounds placed by real-sfx, reviewed by
                         real-sfx and earshot
  openverse.py           real CC0 / CC BY recordings from Openverse, and the series' sound library built from them
  video.py               mixes the sound effects, renders and checks the reel
  instagram.py           posts the reel
reel/                    the video project (HyperFrames); see "The reel" below
instagram/               the account: profile picture, and one folder per post (reel, description, link)
output/WEEK/             that week's results (output/2026-10-* are the earlier daily reels)
output/pipeline.log      every run
output/usage.csv         ElevenLabs credits used
```

## What you get each week (`output/WEEK/`)
| File | What it is |
|------|------------|
| `audio.mp3` | the song, starting on the first sung word |
| `subtitles.srt` | captions timed from the audio |
| `caption.txt` | a one-paragraph summary of the week, the basis for the Instagram description |
| `song.md` | lyrics, sound, fact map and reel notes, for reading |
| `status.json` | the state of each stage and anything that needs your attention |
| `timeline.json` | timing data for building the video: sections, captions and words with real times, BPM, beat grid |
| `reel.mp4` | the finished reel, 1080x1920 at 60 fps (made on request, see below) |
| `song.json`, `audio.json` | the same information in full, for the code |

## Weekly routine
1. The scheduled task "Mu-Zueki Weekly Song" runs every Saturday at 09:00 India time (Friday 11:30 PM in
   New York). It researches the week that just ended and makes its song. To run by hand, double-click
   `run_weekly.cmd`, or run `run_weekly.cmd --week last`.
2. Open `output/WEEK/status.json`. Every stage should say `done`. `needs_review` or `failed` comes with the reason.
3. Listen to `audio.mp3`.
   - Different take, same lyrics: `run_weekly.cmd --week WEEK --from audio`
   - New lyrics as well: `run_weekly.cmd --week WEEK --force`
4. Ask Claude Code to "run the pipeline" to make the reel, watch it, and tell Claude to post it.

## A different kind of song for one week
The persona and the formatting guide decide what a normal song is: about 60 seconds, a hook on the
week's move, a verse on the lead story, a rapid Monday-to-Friday round-up, and an echo of the hook to
close. To steer a single run without changing them, give it a brief, a text file of instructions for the
song writer:

```
run_weekly.cmd --week 2026-W44 --from song --brief prompts\briefs\idol-drop.md --vocal both --stop-after song
```

- `--brief FILE` replaces `extra_instructions` for that run; `--vocal` sets the voice; `--length 45|60|90`
  the reel length.
- `--stop-after song` writes and checks the lyrics and stops. Read `output/WEEK/song.md`, then run
  `run_weekly.cmd --week WEEK` to generate the audio (this is where credits are spent).
- The briefs in `prompts/briefs/`: `idol-drop.md` (a cute idol-pop intro, a beat drop and fast rap),
  `sapakhru.md` (the news as a Gujarati bardic chant over folk drums and hip hop), `slow-melodic.md` and
  `midtempo-band.md` (sung songs set in one named place; use with `--vocal male`).
- To keep a song's music and change only its voice: `python -m pipeline.revoice WEEK VOICE_ID`
  (`--voices` lists the ElevenLabs voices). It replaces the vocal over the same instrumental, so the
  subtitles and timeline stay as they are.
- To make a song sound recorded in a place: `python -m pipeline.ambience WEEK --space rain` (`--spaces`
  lists the places). The guidelines are in `AMBIENCE.md`.
- Redoing a week overwrites its files in `output/WEEK/`; copy the folder first if you want the old one.

## Where the news comes from
The song is written only from `raw_data/us_finance_news_week_WEEK.json`. If you run a week that has no
file yet (`run_weekly.cmd --week 2026-W44`, or `--week last`), the pipeline gathers it first:
1. Claude researches that week's top ten US finance stories by web search, from established sources.
   Rank 1 is the week's market story: how the indexes did over the week.
2. The answer is checked: ten ranked stories, each dated inside the week, each with key facts and real links.
3. A second Claude call re-checks every story against its sources. Facts it cannot support are removed;
   stories it cannot support are dropped. Fewer than eight surviving stories stops the run.

It refuses a week whose Friday session has not closed yet. The research instructions are in
`prompts/news_research.md`.

## How a take is accepted
ElevenLabs does not always sing what it is given, so every take is transcribed with Whisper:
- the opening lines must actually be heard, and
- at least 60% of all the lyric words must be heard.

A failing take is regenerated, up to `max_takes`, and the best one is kept. Any music before the first
sung word is cut off. If no take passes, the best is kept and `status.json` says `needs_review`.
Whisper mishears some rap words, so a passing take can still have a slurred line: your ear is the final check.

## Credits
- ElevenLabs music costs about 450 credits per minute of song, per take: about 450 for a 60-second song.
- `max_credits_per_song` caps one week's song across all takes; `max_takes` caps the retries.
- Audio is never generated for a song that failed its fact checks.

## Good to know
- A week is made once. If its song is done, the weekly run does nothing.
- The song is written by Claude through the `claude` command, using your existing login.
- Prompts in `prompts/` and settings in `config/settings.json` take effect on the next run.
- Set up or change the schedule: `powershell -ExecutionPolicy Bypass -File tools\register_task.ps1 [-Day Saturday] [-Time 09:00]`
  (it also removes the old daily task).
- Remove the schedule: `Unregister-ScheduledTask -TaskName "Mu-Zueki Weekly Song" -Confirm:$false`
- Tests: `.venv\Scripts\python.exe -m unittest discover tests`

## The reel (`reel/`)
The video is a HyperFrames project: a web page plus an animation timeline that Chrome renders frame by
frame. The weekly task does not make it, because each reel is designed from a reference video.

**Making a reel:** in Claude Code, say "run the pipeline" (or "make the reel for 2026-W44"). Claude
runs any missing song stages, then asks which reference to use:
- **your own video** (a file or a link),
- **default**: a random look from `reel/templates/`, or
- **search**: Claude finds a new reference that fits the week's news, mood and beat.

It then goes through every resource (stock footage, illustrations, interface elements, references, the
HyperFrames registry, pixelfx effects, Gemini frames), shows you a line-by-line plan, and builds the
reel only after your yes. Every shot is layered from several of them under one grade. The full procedure
is in `.claude/skills/run-pipeline/SKILL.md`.

**Re-rendering a week whose scenes exist:** double-click `run_video.cmd` (newest week) or
`run_video.cmd 2026-W44`. It uses no ElevenLabs credits.

**Gemini frames:** after generating them in the browser, `python -m pipeline.plates WEEK NAME [NAME ...]`
takes the newest Gemini downloads, in order, into `reel/media/WEEK/plates/` at 1080x1920.

**Preview while editing:** `cd reel`, then `npx hyperframes preview`.

```
reel/
  index.html             the page: fonts, layout, and the scripts of the week being rendered
  lib/                   the kit: kit.js (shots, type, captions, moves), pfx.js (pixelfx effects on a shot),
                         pixelfx/ (the pixelfx library, MIT: source, tools, docs/CATALOG.md; build.mjs bundles it),
                         slap.js (type and interface elements over stock footage), film.js (a slow night film),
                         windows.js, circuit.js, collage.js, pixel.js, ink.js, stitch.js (other looks)
  weeks/WEEK/            one week's scenes, run in file-name order, with footage.json, sfx.json, credits.json, plan.md
  days/DATE/             the daily series' scenes, kept as worked examples
  templates/             one file per look, used by the "default" option
  sound/                 the series' sound design (design.json), library plan (library.json), earshot kit (kit.json),
                         Openverse credits (openverse.json); the audio itself is in sfx/ (not in git)
  references/            log.json (which reference made which reel); the videos themselves stay local
  fonts/                 the typefaces
```

Needs Node.js 22 or newer and FFmpeg (`winget install Gyan.FFmpeg`). `npx hyperframes doctor` checks
the machine.

## Posting to Instagram
After you approve a reel, Claude drafts the description, shows it to you, and on your yes posts the reel
with `python -m pipeline.instagram WEEK`. It uses Meta's official publishing API; no password is stored.
Instagram fetches the video from a public link, so the reel is put on your own Vercel Blob store
for the minute the post takes and deleted again afterwards. A week is never posted twice by accident.

Everything about the account is in `instagram/` (see `instagram/README.md`): each reel gets
`instagram/posts/WEEK/` with the video, its description and a `post.json` that says `draft` or
`posted` with the link.

One-time setup:
1. The Instagram account must be a professional one (Creator or Business): in the app, Settings >
   Account type and tools > Switch to professional account.
2. At developers.facebook.com create an app, add the Instagram product ("API setup with Instagram
   login"), add your Instagram account under it, and generate an access token with the
   `instagram_business_basic` and `instagram_business_content_publish` permissions.
3. Put the token in `config/.env`, together with the Blob store's token (Vercel dashboard > Storage >
   your store > the `.env.local` tab):
   ```
   INSTAGRAM_ACCESS_TOKEN=...
   BLOB_READ_WRITE_TOKEN=...
   ```
   The upload uses the `vercel` command (`npm i -g vercel`).
4. Test it: `.venv\Scripts\python.exe -m pipeline.instagram --check` prints the account name and posts
   nothing.

The token lasts about 60 days; generate a new one in the same place when posting starts failing with
an expired-token message. If your token came from Facebook Login with a Page instead, add
`INSTAGRAM_GRAPH_HOST=graph.facebook.com` and `INSTAGRAM_USER_ID=...`; that route uploads the file to
Meta directly and needs no Blob store.

## Adding a song stage
1. Add `pipeline/stages/NAME.py` with `NAME = "..."` and `run(episode, settings) -> StageResult`.
2. Add its output paths to `pipeline/episode.py` and the module to `STAGES` in `pipeline/stages/__init__.py`.

The runner already handles skipping finished stages, stopping on failure, and rerunning from a stage.
