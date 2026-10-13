@echo off
setlocal
set "ROOT=%~dp0"
if not exist "%ROOT%node_modules\electron\dist\electron.exe" (
  echo Wildbound Electron dependencies are missing. Install project dependencies first.
  pause
  exit /b 1
)
"%ROOT%node_modules\electron\dist\electron.exe" "%ROOT%server-control-main.cjs"
