@echo off
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

echo Stopping any dev servers on ports 3000-3010...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-dev-ports.ps1"
ping 127.0.0.1 -n 3 >nul

echo Removing stale .next cache...
if exist ".next" rmdir /s /q ".next"

echo Starting fresh dev server at http://localhost:3000
call npm.cmd run dev
