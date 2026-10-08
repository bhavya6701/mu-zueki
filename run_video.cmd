@echo off
rem Renders the reel for the newest day (or for a date you pass, such as 2026-10-07) from its audio,
rem timeline and the scenes in reel\days\DATE. Writes output\DATE\reel.mp4. Uses no ElevenLabs credits.
rem The scenes are written by Claude from a reference video: ask Claude to "run the pipeline" first.
cd /d "%~dp0"
.venv\Scripts\python.exe -m pipeline.video %*
set RC=%errorlevel%
echo.
if %RC%==0 echo Finished. The reel is reel.mp4 in the day's output folder.
if %RC%==1 echo The render failed. See the message above.
if %RC%==2 echo The reel was written but did not pass its checks. See the message above.
pause
exit /b %RC%
