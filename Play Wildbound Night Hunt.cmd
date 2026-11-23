@echo off
setlocal
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\launch-desktop.ps1" -Preview %*
if errorlevel 1 (
  echo.
  echo Wildbound Night Hunt did not launch. See the message above.
  if /i not "%~1"=="--check" pause
  exit /b 1
)
