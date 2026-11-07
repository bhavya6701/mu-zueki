"""The weekly song stages, in running order. A new stage is one module added to this list.
The video is not a stage: it is made on request (see pipeline/video.py).

Each stage module has NAME and run(day, settings) -> StageResult, and reads and writes only files
in the day's folder (see pipeline/day.py for the file each stage owns).
"""
from . import audio, song, subtitles

STAGES = [song, audio, subtitles]
