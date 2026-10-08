# The reel (HyperFrames project)

The video half of Mu-Zueki. The procedure for making a day's reel is in `../.claude/skills/run-pipeline/SKILL.md`; the layout is in `../README.md`.

- Invoke the `hyperframes` skill before writing or changing scenes. It holds the composition rules (one paused timeline registered on `window.__timelines["main"]`, no clocks or unseeded randomness, no fetches during a render).
- `index.html` is the shell. `pipeline/video.py` rewrites its day block and `data-duration` values, so do not edit those by hand.
- After any change: `npx hyperframes check .`, then `npx hyperframes snapshot . --at <times>` and look at the frames.
- `npm run dev` previews; `python -m pipeline.video DATE` (from the project root) renders.
