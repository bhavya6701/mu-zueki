"""Run the daily Mu-Zueki pipeline: python -m pipeline [--force | --from STAGE] [--date YYYY-MM-DD]

With --date, a day that has no news file yet gets one first: the news step researches that day's top
US finance stories on the web and writes raw_data/us_finance_news_DATE.json (see pipeline/news.py).

--from STAGE reruns that stage and everything after it, keeping what came before. Only the audio
stage spends ElevenLabs credits, so "--from subtitles" or later never does.

Exit codes: 0 = done or nothing to do, 1 = a stage failed, 2 = finished but needs review.
"""
from __future__ import annotations

import argparse
import shutil
import sys
import traceback

from . import news
from .day import DONE, FAILED, REVIEW, Day, StageResult
from .settings import NEWS_DIR, OUTPUT_DIR, RunError, SettingsError, find_news_file, load_settings, log
from .stages import STAGES


def run_stages(day: Day, settings: dict, stages=STAGES) -> int:
    """Run each stage that is not finished yet, in order. Returns the exit code."""
    code, ran = 0, False
    for position, stage in enumerate(stages):
        state = day.state(stage.NAME)
        if state in (DONE, REVIEW) and not ran:
            code = max(code, 2 if state == REVIEW else 0)
            continue
        # This stage runs, so everything after it is out of date.
        day.reset([s.NAME for s in stages[position + 1:]])
        try:
            result = stage.run(day, settings)
        except (RunError, SettingsError) as exc:
            result = StageResult(FAILED, [str(exc)])
        except Exception:
            result = StageResult(FAILED, ["unexpected error:\n" + traceback.format_exc()])
        ran = True
        day.mark(stage.NAME, result)
        log(f"{stage.NAME}: {result.state}" + "".join(f"\n    - {n}" for n in result.notes))
        if result.state == FAILED:
            return 1
        if result.state == REVIEW:
            code = 2
    if not ran:
        log(f"{day.date}: already done; nothing to do (--from STAGE reruns from a stage, --force starts over)")
    return code


def main() -> int:
    parser = argparse.ArgumentParser(prog="pipeline", description="Write, generate and subtitle the daily song.")
    parser.add_argument("--force", action="store_true", help="start the day over: rewrite the song and everything after")
    parser.add_argument("--from", dest="from_stage", choices=[s.NAME for s in STAGES],
                        help="rerun this stage and every stage after it")
    parser.add_argument("--date", help="news date to run (default: the news_date setting); its news is gathered from the web if there is no file yet")
    args = parser.parse_args()
    if sys.stdout is not None and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    try:
        settings = load_settings()
        wanted = args.date or settings["news_date"]
        # A day asked for by date is gathered if it has no news file. "latest" never gathers.
        if wanted != "latest" and not news.news_path(NEWS_DIR, wanted).exists():
            news.gather(wanted, NEWS_DIR, settings["claude_model"])
        news_path, date = find_news_file(NEWS_DIR, wanted)
        day = Day(OUTPUT_DIR, date, news_path)
        if args.force and day.dir.exists():
            shutil.rmtree(day.dir)
        elif args.from_stage:
            names = [s.NAME for s in STAGES]
            day.reset(names[names.index(args.from_stage):])
        return run_stages(day, settings)
    except (RunError, SettingsError) as exc:
        log(f"FAILED: {exc}")
        return 1
    except Exception:
        log("FAILED with an unexpected error:\n" + traceback.format_exc())
        return 1


if __name__ == "__main__":
    sys.exit(main())
