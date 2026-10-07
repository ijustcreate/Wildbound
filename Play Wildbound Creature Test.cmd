@echo off
setlocal
pushd "%~dp0"
set "WB_CREATURE_ELECTRON=%~dp0test-output\electron-41.10.7\electron.exe"
if not exist "%WB_CREATURE_ELECTRON%" (
  echo The local Electron test runtime is missing:
  echo "%WB_CREATURE_ELECTRON%"
  popd
  if /i not "%~1"=="--check" pause
  exit /b 1
)
if /i "%~1"=="--check" (
  echo Wildbound Creature Test launches current source from:
  echo "%~dp0."
  echo Runtime: "%WB_CREATURE_ELECTRON%"
  echo Uses your existing normal Wildbound save profile. No preview profile.
  echo Existing packaged builds and launchers are unchanged.
  popd
  exit /b 0
)
set "ELECTRON_RUN_AS_NODE="
start "Wildbound Creature Test" "%WB_CREATURE_ELECTRON%" "%~dp0."
popd
exit /b 0
