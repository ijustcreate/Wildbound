@echo off
setlocal
set "BUILD_ROOT=%~dp0"
set "EXE=%BUILD_ROOT%Wildbound-win32-x64\Wildbound.exe"
if not exist "%EXE%" set "EXE=%BUILD_ROOT%..\dist\1.0.5\Wildbound-win32-x64\Wildbound.exe"
if not exist "%EXE%" set "EXE=%BUILD_ROOT%..\dist\Wildbound-win32-x64\Wildbound.exe"
if exist "%EXE%" (
  start "" "%EXE%"
  exit /b 0
)
echo Wildbound is not packaged yet.
echo Place the Wildbound-win32-x64 folder beside this launcher, or run npm run package from the project root.
pause
