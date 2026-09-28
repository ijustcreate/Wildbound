@echo off
setlocal
set "WILDBOUND_ROOT=%~dp0"
set "WILDBOUND_PREVIEW="
for /f "delims=" %%D in ('dir /b /ad /o-n "%WILDBOUND_ROOT%dist\night-hunt-*" 2^>nul') do (
  if not defined WILDBOUND_PREVIEW if exist "%WILDBOUND_ROOT%dist\%%D\Wildbound-win32-x64\resources\app.asar" set "WILDBOUND_PREVIEW=%WILDBOUND_ROOT%dist\%%D\Wildbound-win32-x64"
)
if not defined WILDBOUND_PREVIEW goto missing
if exist "%WILDBOUND_PREVIEW%\Wildbound.exe" (
  start "" "%WILDBOUND_PREVIEW%\Wildbound.exe" --preview
  exit /b
)
exit /b
:missing
echo Night Hunt is not built yet. Run node scripts/package.cjs --preview in this project.
pause
