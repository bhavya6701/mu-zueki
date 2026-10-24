# Mu-Zueki daily reel

Turns a day's US finance news into a hip hop reel and posts it:

1. **News:** the day's top ten stories are gathered from the web and fact-checked.
2. **Song:** Claude writes it, ElevenLabs generates it, and the captions are timed from what was sung.
3. **Video:** a motion-graphics reel is designed from a reference video and rendered with HyperFrames.
4. **Instagram:** once you approve the reel, it is posted with a description.

Setting this up on a new machine: see `SETUP.md`.

## Layout
```
run_daily.cmd            run it by hand (double-click)
config/settings.json     your settings; reused until you change them
config/.env              your keys (copy config/.env.example); never committed
prompts/                 persona.md (the artist), elevenlabs_format.md (how the song is laid out), news_research.md,
                         briefs/ (optional one-run steers for the song, used with --brief)
raw_data/                us_finance_news_DATE.json: the day's news, gathered by the pipeline or dropped in by hand
pipeline/                the code
  news.py                gathers and fact-checks a day's news
  stages/song.py         1. Claude writes the song; it is checked and fact-checked
  stages/audio.py        2. ElevenLabs generates it; Whisper listens to every take
  stages/subtitles.py    3. captions are timed from what was actually sung
  revoice.py             gives a finished song another voice over the same music
  ambience.py            puts a finished song in a place (room, reverb, room tone); see AMBIENCE.md
  video.py               renders and checks the reel
  instagram.py           posts the reel
reel/                    the video project (HyperFrames); see "The reel" below
instagram/               the account: profile picture, and one folder per post (reel, description, link)
output/DATE/             that day's results
output/pipeline.log      every run
output/usage.csv         ElevenLabs credits used
```

## What you get each day (`output/DATE/`)
| File | What it is |
|------|------------|
| `audio.mp3` | the song, starting on the first sung word |
| `subtitles.srt` | captions timed from the audio |
| `caption.txt` | a one-paragraph summary of the day, the basis for the Instagram description |
| `song.md` | lyrics, sound, fact map and reel notes, for reading |
| `status.json` | the state of each stage and anything that needs your attention |
| `timeline.json` | timing data for building the video: sections, captions and words with real times, BPM |
| `reel.mp4` | the finished reel, 1080x1920 at 60 fps (made on request, see below) |
| `song.json`, `audio.json` | the same information in full, for the code |

## Daily routine
1. The scheduled task "Mu-Zueki Daily Song" runs at 10:00 PM. To run by hand, double-click `run_daily.cmd`.
2. Open `output/DATE/status.json`. Every stage should say `done`. `needs_review` or `failed` comes with the reason.
3. Listen to `audio.mp3`.
   - Different take, same lyrics: `run_daily.cmd --from audio`
   - New lyrics as well: `run_daily.cmd --force`
4. Ask Claude Code to "run the pipeline" to make the reel, watch it, and tell Claude to post it.

## A different kind of song for one day
The persona and the formatting guide decide what a normal song is. To steer a single run without
changing them, give it a brief, a text file of instructions for the song writer:

```
run_daily.cmd --date 2026-10-08 --from song --brief prompts\briefs\idol-drop.md --vocal both --stop-after song
```

- `--brief FILE` replaces `extra_instructions` for that run; `--vocal` sets the voice.
- `--stop-after song` writes and checks the lyrics and stops. Read `output/DATE/song.md`, then run
  `run_daily.cmd --date DATE` to generate the audio (this is where credits are spent).
- `prompts/briefs/idol-drop.md` is the structure used for the second version of 2026-10-08: a cute
  idol-pop intro of about six seconds, a beat drop into a different beat, fast rap with no repeated
  hook, and the idol voice back for the sign-off.
- `prompts/briefs/sapakhru.md` is the brief used on 2026-10-09: the news as a sapakhru (the Charani
  chhand of Gujarat) in English, rapped by a sharp high voice over Gujarati folk drums and 2000s hip hop.
- To keep a song's music and change only its voice: `python -m pipeline.revoice DATE VOICE_ID`
  (`--voices` lists the ElevenLabs voices). It replaces the vocal over the same instrumental, so the
  subtitles and timeline stay as they are.
- `prompts/briefs/slow-melodic.md` is the brief used on 2026-10-12: a slow, sung-rap song with held
  words, pauses and a played, many-instrument arrangement, set in one named place. Use it with
  `--vocal male --length 60` (`--length` sets one run's reel length).
- To make a song sound recorded in a place: `python -m pipeline.ambience DATE --space rain` (`--spaces`
  lists the places). It gives the voice the room's reflections and a microphone roll-off and runs a quiet
  bed of room tone under the song; timings do not change. The guidelines are in `AMBIENCE.md`.
- Redoing a day overwrites its files in `output/DATE/`; copy the folder first if you want the old one.

## Where the news comes from
The song is written only from `raw_data/us_finance_news_DATE.json`. If you run a date that has no file
yet (`run_daily.cmd --date 2026-10-08`), the pipeline gathers it first:
1. Claude researches that day's top ten US finance stories by web search, from established sources.
2. The answer is checked: ten ranked stories, all dated that day, each with key facts and real links.
3. A second Claude call re-checks every story against its sources. Facts it cannot support are removed;
   stories it cannot support are dropped. Fewer than eight surviving stories stops the run.

It refuses a day whose US market session has not closed yet. The scheduled nightly run does not gather:
it uses the newest file that is already there. The research instructions are in `prompts/news_research.md`.

## How a take is accepted
ElevenLabs does not always sing what it is given, so every take is transcribed with Whisper:
- the opening lines must actually be heard, and
- at least 60% of all the lyric words must be heard.

A failing take is regenerated, up to `max_takes`, and the best one is kept. Any music before the first
sung word is cut off. If no take passes, the best is kept and `status.json` says `needs_review`.
Whisper mishears some rap words, so a passing take can still have a slurred line: your ear is the final check.

## Credits
- A 42-second take has cost about 190 to 300 ElevenLabs credits on this account.
- `max_credits_per_song` caps one day's song across all takes; `max_takes` caps the retries.
- Audio is never generated for a song that failed its fact checks.

## Good to know
- A day is made once. If no new news file has arrived, the nightly run does nothing.
- The song is written by Claude through the `claude` command, using your existing login.
- Prompts in `prompts/` and settings in `config/settings.json` take effect on the next run.
- Change the schedule: `powershell -ExecutionPolicy Bypass -File tools\register_task.ps1 -Time 21:45`
- Remove the schedule: `Unregister-ScheduledTask -TaskName "Mu-Zueki Daily Song" -Confirm:$false`
- Tests: `.venv\Scripts\python.exe -m unittest discover tests`

## The reel (`reel/`)
The video is a HyperFrames project: a web page plus an animation timeline that Chrome renders frame by
frame. The nightly task does not make it, because each reel is designed from a reference video.

**Making a reel:** in Claude Code, say "run the pipeline" (or "make the reel for 2026-10-07"). Claude
runs any missing song stages, then asks which reference to use:
- **your own video** (a file or a link),
- **default**: a random look from `reel/templates/`, or
- **search**: Claude finds a new motion-graphics reference that fits the day's news, mood and beat.

It then writes that day's scenes, renders `output/DATE/reel.mp4` and checks it. The full procedure is
in `.claude/skills/run-pipeline/SKILL.md`.

**Re-rendering a day whose scenes exist:** double-click `run_video.cmd` (newest day) or
`run_video.cmd 2026-10-07`. It uses no ElevenLabs credits.

**Preview while editing:** `cd reel`, then `npx hyperframes preview`.

```
reel/
  index.html             the page: fonts, layout, and the scripts of the day being rendered
  lib/                   the kit: kit.js (shots, type, captions, moves), pixel.js (pixel-art icons),
                         ink.js (pen lines), windows.js (the windows look), circuit.js (the circuit look),
                         slap.js (the slap look: type and interface elements over stock footage), stitch.js (an embroidered cloth),
                         film.js (the film look: a slow night film with serif lyric, rain and grain)
  days/DATE/             one day's scenes, run in file-name order
  templates/             one file per look, used by the "default" option
  references/            log.json (which reference made which reel); the videos themselves stay local
  fonts/                 the typefaces
```

Needs Node.js 22 or newer and FFmpeg (`winget install Gyan.FFmpeg`). `npx hyperframes doctor` checks
the machine.

## Posting to Instagram
After you approve a reel, Claude drafts the description, shows it to you, and on your yes posts the reel
with `python -m pipeline.instagram DATE`. It uses Meta's official publishing API; no password is stored.
Instagram fetches the video from a public link, so the reel is put on your own Vercel Blob store
for the minute the post takes and deleted again afterwards. A day is never posted
twice by accident.

Everything about the account is in `instagram/` (see `instagram/README.md`): each reel gets
`instagram/posts/DATE/` with the video, its description and a `post.json` that says `draft` or
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
1. Add `pipeline/stages/NAME.py` with `NAME = "..."` and `run(day, settings) -> StageResult`.
2. Add its output paths to `pipeline/day.py` and the module to `STAGES` in `pipeline/stages/__init__.py`.

The runner already handles skipping finished stages, stopping on failure, and rerunning from a stage.
