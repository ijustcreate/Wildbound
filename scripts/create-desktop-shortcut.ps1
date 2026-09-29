param(
  [string]$DesktopPath = (Join-Path $env:USERPROFILE 'Desktop')
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$package = Get-Content -Raw (Join-Path $root 'package.json') | ConvertFrom-Json
$version = [string]$package.version
$buildDir = Join-Path $root "dist\$version\Wildbound-win32-x64"
$exe = Join-Path $buildDir 'Wildbound.exe'
$icon = Join-Path $root 'assets\wildbound-icon.ico'

if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) {
  throw "Packaged executable not found: $exe. Run node scripts/package.cjs first."
}
if (-not (Test-Path -LiteralPath $icon -PathType Leaf)) {
  throw "Icon not found: $icon"
}
if (-not (Test-Path -LiteralPath $DesktopPath -PathType Container)) {
  New-Item -ItemType Directory -Path $DesktopPath | Out-Null
}

$shortcutPath = Join-Path $DesktopPath "Wildbound Latest ($version).lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $exe
$shortcut.WorkingDirectory = $buildDir
$shortcut.IconLocation = "$icon,0"
$shortcut.Description = "Wildbound $version - The Living Board"
$shortcut.Save()

Write-Output "Created: $shortcutPath"
Write-Output "Target:  $exe"
