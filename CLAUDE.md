# Mu-Zueki

A daily finance-news hip hop reel: `pipeline/` (Python) writes and generates the song, `reel/` (HyperFrames) is the video. `README.md` describes the layout and the day-to-day use.

- When asked to run the pipeline, make a reel or redo a day's video, follow `.claude/skills/run-pipeline/SKILL.md`. It always starts the video step by asking the user for a reference video (their own, a default template, or one you search for).
- Only the audio stage spends ElevenLabs credits. Say so before running it.
- Tests: `.venv\Scripts\python.exe -m unittest discover tests`.
- `output/`, `reel/audio.mp3`, `reel/data/`, `reel/renders/` and `reel/snapshots/` are generated.
- `instagram/` is the account folder: `posts/DATE/` holds each reel, its description and `post.json` (draft or posted). Keep it in step with every reel you render. Never post without the user approving the reel and then the description.
