@echo off
setlocal
set "ROOT=%~dp0"
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\start-persistent-server.ps1" %*
if errorlevel 1 (
  echo Wildbound persistent server could not start. See the message above.
  pause
  exit /b 1
)
exit /b 0
