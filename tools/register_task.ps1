# Creates or updates the daily scheduled task that runs the Mu-Zueki pipeline.
# Usage:  powershell -ExecutionPolicy Bypass -File tools\register_task.ps1 [-Time 22:00]
# Remove: Unregister-ScheduledTask -TaskName "Mu-Zueki Daily Song" -Confirm:$false
param([string]$Time = "22:00")

$taskName = "Mu-Zueki Daily Song"
$root = Split-Path $PSScriptRoot -Parent
$pythonw = Join-Path $root ".venv\Scripts\pythonw.exe"  # windowless: no console pops up
if (-not (Test-Path $pythonw)) { throw "Run run_daily.cmd once first; it creates .venv" }

$action = New-ScheduledTaskAction -Execute $pythonw -Argument "-m pipeline" -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -Daily -At $Time
# Runs in the logged-on user's session so the Claude login is available.
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 1)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal `
    -Settings $settings -Description "Writes, generates and subtitles the daily Mu-Zueki song" -Force | Out-Null
Write-Output "Registered '$taskName' to run daily at $Time. Log: $root\output\pipeline.log"
