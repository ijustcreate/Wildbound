param(
  [string]$DesktopPath = [Environment]::GetFolderPath('Desktop')
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'checkout-identity.ps1')
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$package = Get-Content -Raw (Join-Path $root 'package.json') | ConvertFrom-Json
$version = [string]$package.version
$launcher = Join-Path $root 'Play Wildbound.cmd'
$icon = Join-Path $root 'assets\wildbound-icon.ico'

if (-not (Test-Path -LiteralPath $icon -PathType Leaf)) {
  throw "Icon not found: $icon"
}
if (-not (Test-Path -LiteralPath $launcher -PathType Leaf)) {
  throw "Launcher not found: $launcher"
}
$commit = Get-WildboundCheckoutCommit -Root $root
$candidates = @(Get-ChildItem -LiteralPath (Join-Path $root 'dist') -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like "$version-*" } |
  ForEach-Object {
    $dir = Join-Path $_.FullName 'Wildbound-win32-x64'
    $manifestPath = Join-Path $dir 'wildbound-build.json'
    $exePath = Join-Path $dir 'Wildbound.exe'
    if ((Test-Path -LiteralPath $manifestPath -PathType Leaf) -and (Test-Path -LiteralPath $exePath -PathType Leaf)) {
      $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
      if ([string]$manifest.version -eq $version -and -not $manifest.preview -and [string]$manifest.sourceCommit -eq $commit) {
        [pscustomobject]@{ Dir=$dir; Exe=$exePath; Manifest=$manifest }
      }
    }
  } | Sort-Object { $_.Manifest.builtAt } -Descending)
$selected = $candidates | Select-Object -First 1
if (-not $selected) { throw "No verified packaged build for $version and checkout $commit. Run node scripts/package.cjs first." }
$buildDir = $selected.Dir
$exe = $selected.Exe
$manifest = $selected.Manifest
if ($manifest.sourceDirty) {
  Write-Warning 'This build was packaged with modified tracked source. Its commit alone does not identify every change.'
}
if (-not (Test-Path -LiteralPath $DesktopPath -PathType Container)) {
  New-Item -ItemType Directory -Path $DesktopPath | Out-Null
}

$shortcutPath = Join-Path $DesktopPath "Wildbound Worlds ($version).lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcher
$shortcut.WindowStyle = 7
$shortcut.WorkingDirectory = $root
$shortcut.IconLocation = "$icon,0"
$shortcut.Description = "Wildbound $version - verifies the local desktop build before launch"
$shortcut.Save()

Write-Output "Created: $shortcutPath"
Write-Output "Target:  $launcher"
Write-Output "Build:   $exe"
Write-Output "Source:  $commit"
