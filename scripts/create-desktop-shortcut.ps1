param(
  [string]$DesktopPath = [Environment]::GetFolderPath('Desktop'),
  [string]$BuildDirectory = ''
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'desktop-build.ps1')
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$launcher = Join-Path $root 'Play Wildbound.cmd'
$icon = Join-Path $root 'assets\wildbound-icon.ico'

if (-not (Test-Path -LiteralPath $icon -PathType Leaf)) {
  throw "Icon not found: $icon"
}
if (-not (Test-Path -LiteralPath $launcher -PathType Leaf)) {
  throw "Launcher not found: $launcher"
}
$selected = Get-WildboundDesktopBuild -Root $root -BuildDirectory $BuildDirectory
$manifest = $selected.Manifest
if ($manifest.variant) { throw 'The Wildbound Worlds shortcut requires a standard desktop build.' }
$version = [string]$manifest.version
$relativeBuildDir = $selected.Dir.Substring($root.Length + 1)
if ($manifest.sourceDirty) {
  Write-Warning 'This build was packaged with modified source. Its commit alone does not identify every change.'
}
if (-not (Test-Path -LiteralPath $DesktopPath -PathType Container)) {
  New-Item -ItemType Directory -Path $DesktopPath | Out-Null
}

$shortcutPath = Join-Path $DesktopPath "Wildbound Worlds ($version).lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcher
$shortcut.Arguments = '-BuildDirectory "' + $relativeBuildDir + '"'
$shortcut.WindowStyle = 7
$shortcut.WorkingDirectory = $root
$shortcut.IconLocation = "$icon,0"
$shortcut.Description = "Wildbound $version - verifies the local desktop build before launch"
$shortcut.Save()

Write-Output "Created: $shortcutPath"
Write-Output "Target:  $launcher"
Write-Output "Build:   $($selected.Exe)"
Write-Output "Source:  $($manifest.sourceCommit)"
Write-Output "Version: $version"
