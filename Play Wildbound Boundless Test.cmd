@echo off
setlocal
cd /d "%~dp0"

if not exist "%~dp0node_modules\.bin\electron.cmd" (
  echo Wildbound's local Electron install was not found.
  echo From this folder, run npm install and then launch this file again.
  pause
  exit /b 1
)

call "%~dp0node_modules\.bin\electron.cmd" "%~dp0" --preview
if errorlevel 1 (
  echo.
  echo Wildbound Boundless Test did not launch. See the message above.
  pause
  exit /b 1
)
