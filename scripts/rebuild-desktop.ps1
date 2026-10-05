param(
  [string]$DesktopPath = [Environment]::GetFolderPath('Desktop')
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Push-Location $root
try {
  $version = [string](Get-Content -Raw 'package.json' | ConvertFrom-Json).version
  $exe = Join-Path $root "dist\$version\Wildbound-win32-x64\Wildbound.exe"
  $running = Get-CimInstance Win32_Process -Filter "name = 'Wildbound.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.ExecutablePath -eq $exe }
  if ($running) {
    throw "The target build is running: $exe. Close that game before rebuilding."
  }
  if (-not (Test-Path -LiteralPath 'node_modules/@electron/packager' -PathType Container) -or
      -not (Test-Path -LiteralPath 'node_modules/electron/dist/electron.exe' -PathType Leaf)) {
    throw 'Desktop dependencies are missing. Install Node.js/npm and run npm ci, then rerun this script.'
  }
  $tests = @(Get-ChildItem -Path 'tests' -Filter '*.test.mjs' -File | ForEach-Object FullName)
  & node --test --test-concurrency=1 @tests
  if ($LASTEXITCODE -ne 0) { throw 'Tests failed. The desktop build was not replaced.' }
  & node scripts/package.cjs
  if ($LASTEXITCODE -ne 0) { throw 'Packaging failed. The desktop shortcut was not changed.' }
  & (Join-Path $PSScriptRoot 'create-desktop-shortcut.ps1') -DesktopPath $DesktopPath
  if (-not $?) { throw 'Desktop shortcut creation failed.' }
  Write-Output "Ready: $exe"
} finally {
  Pop-Location
}
