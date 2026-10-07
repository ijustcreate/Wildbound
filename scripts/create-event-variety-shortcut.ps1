param([string]$DesktopPath = [Environment]::GetFolderPath('Desktop'))
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
& (Join-Path $PSScriptRoot 'launch-event-variety.ps1') -Check
if (-not $?) { throw 'The event-variety build was not verified.' }
$launcher = Join-Path $root 'Play Wildbound Varied Events.cmd'
$shortcutPath = Join-Path $DesktopPath 'Wildbound Varied Events.lnk'
if (Test-Path -LiteralPath $shortcutPath) { throw "Refusing to replace an existing shortcut: $shortcutPath" }
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcher
$shortcut.WorkingDirectory = $root
$shortcut.IconLocation = "$(Join-Path $root 'assets\wildbound-icon.ico'),0"
$shortcut.Description = 'Wildbound Varied Events test build: saved encounter coverage and held-Jump wing hover; normal saves'
$shortcut.Save()
$verified = $shell.CreateShortcut($shortcutPath)
if ($verified.TargetPath -ne $launcher -or $verified.WorkingDirectory -ne $root -or $verified.Arguments) {
  throw 'The new desktop shortcut did not retain its exact target.'
}
Write-Output "Created: $shortcutPath"
Write-Output "Target: $($verified.TargetPath)"
