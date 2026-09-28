@echo off
setlocal
set "BUILD_ROOT=%~dp0"
set "EXE=%BUILD_ROOT%Wildbound-win32-x64\Wildbound.exe"
set "LOCAL_ELECTRON=%BUILD_ROOT%..\node_modules\.pnpm\electron@41.10.7\node_modules\electron\dist\electron.exe"
if exist "%LOCAL_ELECTRON%" (
  start "" "%LOCAL_ELECTRON%" "%BUILD_ROOT%..\."
  exit /b 0
)
if not exist "%EXE%" set "EXE=%BUILD_ROOT%..\dist\1.0.6\Wildbound-win32-x64\Wildbound.exe"
if not exist "%EXE%" set "EXE=%BUILD_ROOT%..\dist\Wildbound-win32-x64\Wildbound.exe"
if exist "%EXE%" (
  start "" "%EXE%"
  exit /b 0
)
set "LOCAL_ELECTRON=%BUILD_ROOT%..\node_modules\electron\dist\electron.exe"
if exist "%LOCAL_ELECTRON%" (
  start "" "%LOCAL_ELECTRON%" "%BUILD_ROOT%..\."
  exit /b 0
)
echo Wildbound is not packaged yet.
echo Install the project dependencies or place the packaged build beside this launcher.
pause
