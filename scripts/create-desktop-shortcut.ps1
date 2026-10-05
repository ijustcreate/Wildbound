param(
  [string]$DesktopPath = [Environment]::GetFolderPath('Desktop')
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$package = Get-Content -Raw (Join-Path $root 'package.json') | ConvertFrom-Json
$version = [string]$package.version
$buildDir = Join-Path $root "dist\$version\Wildbound-win32-x64"
$exe = Join-Path $buildDir 'Wildbound.exe'
$manifestPath = Join-Path $buildDir 'wildbound-build.json'
$launcher = Join-Path $root 'Play Wildbound.cmd'
$icon = Join-Path $root 'assets\wildbound-icon.ico'

if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) {
  throw "Packaged executable not found: $exe. Run node scripts/package.cjs first."
}
if (-not (Test-Path -LiteralPath $icon -PathType Leaf)) {
  throw "Icon not found: $icon"
}
if (-not (Test-Path -LiteralPath $launcher -PathType Leaf)) {
  throw "Launcher not found: $launcher"
}
if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
  throw "Build identity not found: $manifestPath. Rebuild with node scripts/package.cjs."
}
$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
$commit = (& git -C $root rev-parse HEAD).Trim()
if ([string]$manifest.version -ne $version -or $manifest.preview -or [string]$manifest.sourceCommit -ne $commit) {
  throw "The packaged build does not match this checkout ($commit). Rebuild with node scripts/package.cjs."
}
if ($manifest.sourceDirty) {
  Write-Warning 'This build was packaged with modified tracked source. Its commit alone does not identify every change.'
}
if (-not (Test-Path -LiteralPath $DesktopPath -PathType Container)) {
  New-Item -ItemType Directory -Path $DesktopPath | Out-Null
}

$shortcutPath = Join-Path $DesktopPath "Wildbound Latest ($version).lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcher
$shortcut.WorkingDirectory = $root
$shortcut.IconLocation = "$icon,0"
$shortcut.Description = "Wildbound $version - verifies the local desktop build before launch"
$shortcut.Save()

Write-Output "Created: $shortcutPath"
Write-Output "Target:  $launcher"
Write-Output "Build:   $exe"
Write-Output "Source:  $commit"
