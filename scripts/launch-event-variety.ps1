param([switch]$Check)
$ErrorActionPreference = 'Stop'

function Get-VerifiedEventBuild {
  param([string]$Directory, [string]$Version = '')
  $exe = Join-Path $Directory 'Wildbound.exe'
  $manifestPath = Join-Path $Directory 'wildbound-build.json'
  if (-not (Test-Path -LiteralPath $exe -PathType Leaf) -or
      -not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { return }
  try {
    $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
  } catch { return }
  if ($manifest.variant -ne 'Varied Events Test' -or $manifest.eventDirectorVersion -ne 2 -or
      $manifest.preview -or [string]$manifest.version -notmatch '^\d+\.\d+\.\d+$' -or
      ($Version -and [string]$manifest.version -ne $Version)) { return }
  [pscustomobject]@{ Directory = $Directory; Exe = $exe; Manifest = $manifest }
}

try {
  $root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
  $dist = Join-Path $root 'dist'
  $selected = Get-ChildItem -LiteralPath $dist -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^\d+\.\d+\.\d+$' } |
    Sort-Object { [version]$_.Name } -Descending |
    ForEach-Object { Get-VerifiedEventBuild -Directory (Join-Path $_.FullName 'Wildbound-win32-x64') -Version $_.Name } |
    Select-Object -First 1
  if (-not $selected) {
    $receipt = Join-Path $root 'test-output\event-variety-build.json'
    if (-not (Test-Path -LiteralPath $receipt -PathType Leaf)) { throw 'No verified Varied Events desktop build found.' }
    $identity = Get-Content -Raw -LiteralPath $receipt | ConvertFrom-Json
    $packageDir = [IO.Path]::GetFullPath([string]$identity.packageDir)
    $parent = Split-Path -Parent $packageDir
    if ((Split-Path -Leaf $packageDir) -ne 'Wildbound-win32-x64' -or
        (Split-Path -Parent $parent) -ne $dist -or (Split-Path -Leaf $parent) -notlike 'event-variety-*' -or
        [IO.Path]::GetFullPath([string]$identity.executable) -ne (Join-Path $packageDir 'Wildbound.exe')) {
      throw 'Invalid event-variety build target.'
    }
    $selected = Get-VerifiedEventBuild -Directory $packageDir
    if (-not $selected) { throw 'The pinned legacy Varied Events desktop build could not be verified.' }
  }
  if ($Check) {
    $manifest = $selected.Manifest
    $dirtySuffix = if ($manifest.sourceDirty) { ' (modified source)' } else { '' }
    Write-Output "Build: $($selected.Exe)"
    Write-Output "Version: $($manifest.version)"
    Write-Output "Built: $($manifest.builtAt)"
    Write-Output "Source: $($manifest.sourceCommit)$dirtySuffix"
    Write-Output 'Profile: existing normal Wildbound saves; no --preview'
    return
  }
  Start-Process -FilePath $selected.Exe -WorkingDirectory $selected.Directory
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
