@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\launch-desktop.ps1" %*
if errorlevel 1 (
  echo.
  echo Wildbound did not launch. See the message above.
  if /i not "%~1"=="--check" pause
  exit /b 1
)
