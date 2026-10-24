# Mu-Zueki

A daily finance-news hip hop reel: `pipeline/` (Python) writes and generates the song, `reel/` (HyperFrames) is the video. `README.md` describes the layout and the day-to-day use.

- When asked to run the pipeline, make a reel or redo a day's video, follow `.claude/skills/run-pipeline/SKILL.md`. The video step always goes in this order: ask the user for a reference video (their own, a default template, or one you search for); brainstorm the video by going through every resource in the skill's table (stock footage, illustrations, interface elements, reference films, the HyperFrames registry, past reels); show the user the idea and a line-by-line picture plan and get a yes; only then build.
- A reel is pictures with the lyric over them, not the lyric alone: full 9:16, clean corners, footage or illustrations from the resource sites on every line. The skill lists the rules the user has set.
- The audio stage spends ElevenLabs credits, and so do `pipeline.revoice` and `pipeline.ambience` (the stem split). Say so before running them.
- Ambience (`AMBIENCE.md`, `pipeline/ambience.py`) is added to a song before its video is started, and kept subtle: it must never affect the song or make the voice sound artificial. The video is set in the same place.
- Tests: `.venv\Scripts\python.exe -m unittest discover tests`.
- `output/`, `reel/audio.mp3`, `reel/data/`, `reel/renders/` and `reel/snapshots/` are generated.
- `instagram/` is the account folder: `posts/DATE/` holds each reel, its description and `post.json` (draft or posted). Keep it in step with every reel you render. Never post without the user approving the reel and then the description.
