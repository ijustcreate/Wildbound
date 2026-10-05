@echo off
setlocal
set "BUILD_ROOT=%~dp0"
set "EXE=%BUILD_ROOT%Wildbound-win32-x64\Wildbound.exe"
if exist "%EXE%" (
  start "" "%EXE%"
  exit /b 0
)
if exist "%BUILD_ROOT%..\Play Wildbound.cmd" (
  call "%BUILD_ROOT%..\Play Wildbound.cmd" %*
  exit /b %errorlevel%
)
echo Wildbound is not packaged yet.
echo Put the complete Wildbound-win32-x64 folder beside this launcher.
pause
