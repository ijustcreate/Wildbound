@echo off
setlocal
cd /d "%~dp0"
set "WILDBOUND_NODE="
for /f "delims=" %%N in ('where node 2^>nul') do if not defined WILDBOUND_NODE set "WILDBOUND_NODE=%%N"
if not defined WILDBOUND_NODE if exist "%LOCALAPPDATA%\..\..\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "WILDBOUND_NODE=%LOCALAPPDATA%\..\..\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not defined WILDBOUND_NODE (
  echo Install Node.js LTS, then run this launcher again.
  pause
  exit /b 1
)
"%WILDBOUND_NODE%" "%~dp0scripts\launch-browser.cjs" %*
if errorlevel 1 pause
