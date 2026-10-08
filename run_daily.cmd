@echo off
rem Makes today's Mu-Zueki song: lyrics, audio and subtitles.
rem   --from audio      keep the lyrics, generate new audio and everything after it
rem   --from subtitles  keep the audio, redo the timing data (no ElevenLabs credits)
rem   --force           start the day over, rewriting the lyrics too
cd /d "%~dp0"
if not exist .venv\Scripts\python.exe (
  echo First run: setting up Python packages, about 1 GB...
  py -3 -m venv .venv || goto :fail
  .venv\Scripts\python.exe -m pip install --quiet -r requirements.txt || goto :fail
)
.venv\Scripts\python.exe -m pipeline %*
set RC=%errorlevel%
echo.
if %RC%==0 echo Finished. Open the newest folder in output\
if %RC%==1 echo A stage failed. See the messages above, or status.json in the newest output folder.
if %RC%==2 echo Finished, but something needs your attention. See status.json in the newest output folder.
pause
exit /b %RC%

:fail
echo Setup failed. See the message above.
pause
exit /b 1
