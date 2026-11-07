# Creates or updates the weekly scheduled task that runs the Mu-Zueki pipeline, and removes the old daily one.
# It runs after Friday's close in New York: the default, Saturday 09:00 India time, is Friday 11:30 PM Eastern.
# The run researches the week that just ended (--week last), then writes, generates and subtitles its song.
# Usage:  powershell -ExecutionPolicy Bypass -File tools\register_task.ps1 [-Day Saturday] [-Time 09:00]
# Remove: Unregister-ScheduledTask -TaskName "Mu-Zueki Weekly Song" -Confirm:$false
param([string]$Day = "Saturday", [string]$Time = "09:00")

$taskName = "Mu-Zueki Weekly Song"
$root = Split-Path $PSScriptRoot -Parent
$pythonw = Join-Path $root ".venv\Scripts\pythonw.exe"  # windowless: no console pops up
if (-not (Test-Path $pythonw)) { throw "Run run_weekly.cmd once first; it creates .venv" }

if (Get-ScheduledTask -TaskName "Mu-Zueki Daily Song" -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName "Mu-Zueki Daily Song" -Confirm:$false
    Write-Output "Removed the old daily task."
}

$action = New-ScheduledTaskAction -Execute $pythonw -Argument "-m pipeline --week last" -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Day -At $Time
# Runs in the logged-on user's session so the Claude login is available.
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
# Researching a week of news takes longer than a day's, so the run may take up to two hours.
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal `
    -Settings $settings -Description "Researches the week's US finance news, then writes, generates and subtitles the weekly Mu-Zueki song" -Force | Out-Null
Write-Output "Registered '$taskName' to run every $Day at $Time. Log: $root\output\pipeline.log"
