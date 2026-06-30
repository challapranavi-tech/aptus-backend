@echo off
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"
if not exist "C:\Program Files\nodejs\npm.cmd" (
  echo Node.js not found. Install from https://nodejs.org/
  pause
  exit /b 1
)

echo Stopping old dev servers on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm.cmd install
)

echo.
echo Starting at http://localhost:3000
echo Keep this window open while developing.
echo.
call npm.cmd run dev
pause
