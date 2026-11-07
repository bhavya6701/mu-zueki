# Setting up your own

This repo makes a weekly finance-news hip hop reel: it gathers the news, writes and generates a song,
builds a motion-graphics video cut to it, and posts it to Instagram. This page takes a new machine from
a fresh clone to a posted reel. `README.md` explains how each part works once it is running.

It was built and run on Windows 11. The Python and HyperFrames parts are not Windows-specific, but the
`.cmd` launchers and the scheduled task are.

## What you need

| What | Why | Cost |
|------|-----|------|
| [Claude Code](https://code.claude.com/docs) with a paid Claude plan | writes the song, gathers the news, and designs each reel | your plan |
| [ElevenLabs](https://elevenlabs.io) account with Music API access | generates the song | about 200 to 300 credits a song |
| Python 3.12 | the song pipeline | free |
| Node.js 22 or newer | HyperFrames, which renders the video | free |
| FFmpeg | encoding and checking the video | free |
| Instagram professional account, a Meta developer app, a Vercel account | posting (optional) | free |

About 3 GB of disk: the Python packages (speech recognition) are roughly 1 GB, and HyperFrames downloads
its own Chrome.

## 1. Install the tools

```
winget install Python.Python.3.12
winget install OpenJS.NodeJS.LTS
winget install Gyan.FFmpeg
```

Install Claude Code (`irm https://claude.ai/install.ps1 | iex` in PowerShell) and log in by running
`claude` once. Open a new terminal afterwards so the new commands are found.

## 2. Get the code and the Python packages

```
git clone <this repo>
cd <the folder>
run_weekly.cmd
```

The first run of `run_weekly.cmd` creates `.venv` and installs the packages. It will then stop because
there is no API key yet; that is expected.

## 3. Add your keys

Copy `config/.env.example` to `config/.env` and fill in `ELEVENLABS_API_KEY`. The Instagram values can
wait until step 7. `config/.env` is ignored by git; never commit it.

## 4. Set up HyperFrames

```
cd reel
npx hyperframes doctor
npx hyperframes skills
```

`doctor` should show Node.js, FFmpeg, FFprobe and Chrome as found. Ignore what it calls optional
(whisper-cpp, Kokoro, MusicGen, Docker). `skills` installs the HyperFrames skills that Claude Code uses
when it writes a reel. Restart Claude Code afterwards so it loads them.

## 5. Make it yours

- `prompts/persona.md`: the artist. Change the name, voice and rules here. The sign-off "Mu-Zueki" also
  appears in the daily-series scenes under `reel/days/`, which you can delete.
- `prompts/elevenlabs_format.md`: how a song is laid out for ElevenLabs.
- `prompts/news_research.md`: what counts as the week's news and which sources are trusted.
- `config/settings.json`: song length, vocal, mood and credit limits. The file explains each field.
- `instagram/`: this is the original account's folder. Replace `profile_picture/` and empty `posts/`.
- `raw_data/` and `reel/references/log.json`: the original account's history. Empty `raw_data/` and
  reset `log.json` to `[]` to start clean.

The reference videos behind the two saved looks are not in the repo (they are other people's work).
The looks themselves are: `reel/templates/` describes them and `reel/lib/` implements them.

## 6. Make a first reel

Open Claude Code in the repo folder and say:

> run the pipeline for 2026-W43

(use a recent week whose Friday session has closed). Claude follows `.claude/skills/run-pipeline/SKILL.md`:

1. It gathers and fact-checks that week's top ten US finance stories into `raw_data/` (15 to 30 minutes).
2. It writes the song, generates the audio (this spends ElevenLabs credits) and times the captions.
3. It asks which reference video to use: your own, a saved look, or one it searches for.
4. It goes through every resource (stock footage, illustrations, interface elements, the HyperFrames
   registry, pixelfx, Gemini frames in Chrome) and shows you a line-by-line plan.
5. After your yes it writes the week's scenes, renders `output/WEEK/reel.mp4` and checks it.

Gemini frames need Chrome with the Claude in Chrome extension and a Google account with Gemini Pro image
generation (about 10 images a day).

Watch the reel with sound before posting it. The checks cover format and length, not taste or sync.

To run the tests: `.venv\Scripts\python.exe -m unittest discover tests`.

## 7. Posting to Instagram (optional)

Posting uses Meta's official API. Instagram fetches the video from a public link, so the reel is put
on a Vercel Blob store for the minute a post takes and then deleted.

1. **Instagram:** switch the account to a professional one (Settings > Account type and tools). The
   Creator type with the Musician/band or Digital creator category fits.
2. **Meta app:** at developers.facebook.com create an app and choose the Instagram use case with
   **Instagram login** (not Facebook login). Under Instagram > API setup with Instagram login, add your
   account (accept the tester invite at instagram.com > Settings > Apps and websites > Tester invites if
   asked), then **Generate token**. Leave webhooks off; App Review is not needed for your own account.
3. **Vercel:** `npm i -g vercel`, `vercel login`, then
   `vercel blob create-store my-reels --access public`. In the Vercel dashboard open Storage > your
   store and copy `BLOB_READ_WRITE_TOKEN` from the `.env.local` tab.
4. Put both tokens in `config/.env` (`INSTAGRAM_ACCESS_TOKEN`, `BLOB_READ_WRITE_TOKEN`).
5. Test: `.venv\Scripts\python.exe -m pipeline.instagram --check` prints your account name and posts
   nothing.

After that, tell Claude to post a week's reel once you have approved it. The Instagram token lasts about
60 days; generate a new one in the same place when it expires.

## 8. Run it every week (optional)

```
powershell -ExecutionPolicy Bypass -File tools\register_task.ps1 -Day Saturday -Time 09:00
```

This registers a Windows scheduled task that runs after Friday's close in New York (the default,
Saturday 09:00 India time, is Friday 11:30 PM Eastern). It researches the week that just ended and makes
its song. Pick a local time after 4:30 PM Eastern on Friday. It does not build the video or post: those are done on request in Claude Code, because the
video needs a reference and a look at the result.

## If something fails

| Symptom | What to do |
|---------|------------|
| `ffmpeg` or `node` not found after installing | open a new terminal |
| `The 'claude' command was not found` | install Claude Code and run `claude` once to log in |
| The news step says the week is not over | Friday's session has not closed; run it after 4:30 PM Eastern on Friday |
| `needs_review` in `output/WEEK/status.json` | the reason is next to it; usually a take where too few words were heard. `run_weekly.cmd --week WEEK --from audio` makes another |
| `hyperframes check` fails on new scenes | Claude fixes these while building; for hand edits, read the message, it names the element |
| Instagram refuses with an expired token | generate a new token in the Meta app and replace it in `config/.env` |
