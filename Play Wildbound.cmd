@echo off
setlocal
set "WILDBOUND_ROOT=%~dp0"
rem Launch the newest complete preview package so the desktop shortcut stays current.
set "WILDBOUND_BUILD="
for /f "delims=" %%D in ('dir /b /ad /o-n "%WILDBOUND_ROOT%dist\night-hunt-*" 2^>nul') do (
  if not defined WILDBOUND_BUILD if exist "%WILDBOUND_ROOT%dist\%%D\Wildbound-win32-x64\resources\app.asar" set "WILDBOUND_BUILD=%WILDBOUND_ROOT%dist\%%D\Wildbound-win32-x64"
)
if not defined WILDBOUND_BUILD if exist "%WILDBOUND_ROOT%dist\1.0.7\Wildbound-win32-x64\Wildbound.exe" set "WILDBOUND_BUILD=%WILDBOUND_ROOT%dist\1.0.7\Wildbound-win32-x64"
if not defined WILDBOUND_BUILD goto missing
if /i "%~1"=="--check" (
  echo "%WILDBOUND_BUILD%\Wildbound.exe"
  exit /b 0
)
if exist "%WILDBOUND_BUILD%\Wildbound.exe" (
  start "" "%WILDBOUND_BUILD%\Wildbound.exe" --preview
  exit /b
)
:missing
echo Wildbound is not built yet. Run node scripts/package.cjs --preview in this project.
pause
