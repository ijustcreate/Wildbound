@echo off
setlocal
set "WILDBOUND_ROOT=%~dp0"
if exist "%WILDBOUND_ROOT%node_modules\.pnpm\electron@41.10.7\node_modules\electron\dist\electron.exe" (
  start "" "%WILDBOUND_ROOT%node_modules\.pnpm\electron@41.10.7\node_modules\electron\dist\electron.exe" "%WILDBOUND_ROOT%."
  exit /b
)
if exist "%WILDBOUND_ROOT%dist\1.0.6\Wildbound-win32-x64\Wildbound.exe" (
  start "" "%WILDBOUND_ROOT%dist\1.0.6\Wildbound-win32-x64\Wildbound.exe"
  exit /b
)
if exist "%WILDBOUND_ROOT%dist\Wildbound-win32-x64\Wildbound.exe" (
  start "" "%WILDBOUND_ROOT%dist\Wildbound-win32-x64\Wildbound.exe"
  exit /b
)
if exist "%WILDBOUND_ROOT%node_modules\electron\dist\electron.exe" (
  start "" "%WILDBOUND_ROOT%node_modules\electron\dist\electron.exe" "%WILDBOUND_ROOT%."
  exit /b
)
if exist "%WILDBOUND_ROOT%build\Launch Wildbound.cmd" (
  call "%WILDBOUND_ROOT%build\Launch Wildbound.cmd"
  exit /b
)
echo Wildbound is not built yet. Run npm install and npm run package in this folder.
pause
