# The reel (HyperFrames project)

The video half of Mu-Zueki. The procedure for making a week's reel is in `../.claude/skills/run-pipeline/SKILL.md`; the layout is in `../README.md`.

- Invoke the `hyperframes` skill before writing or changing scenes. It holds the composition rules (one paused timeline registered on `window.__timelines["main"]`, no clocks or unseeded randomness, no fetches during a render).
- `index.html` is the shell. `pipeline/video.py` rewrites its scenes block, its footage block and `data-duration` values, so do not edit those by hand.
- After any change: `npx --yes hyperframes@0.9.12 check .`, then `npx --yes hyperframes@0.9.12 snapshot . --at <times>` and look at the frames.
- pixelfx (`lib/pixelfx/`) is vendored at patch-gg/pixelfx commit a841596 (MIT; its gallery font and README GIFs are not included). The reel loads the bundle `lib/pixelfx/pixelfx.js`: after changing or adding an effect run `node build.mjs` there. Shots use it through `s.pfx` (`lib/pfx.js`).
- `npm run dev` previews; `python -m pipeline.video WEEK` (from the project root) renders.
