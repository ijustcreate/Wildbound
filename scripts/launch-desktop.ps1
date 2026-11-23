param([switch]$Check, [string]$BuildDirectory = '', [switch]$Preview)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'desktop-build.ps1')
try {
  $root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
  $selected = Get-WildboundDesktopBuild -Root $root -BuildDirectory $BuildDirectory -Preview:$Preview
  $manifest = $selected.Manifest
  if ($manifest.sourceDirty) {
    Write-Warning 'This build was packaged with modified source. Its commit alone does not identify every change.'
  }
  if ($Check) {
    Write-Output "Build: $($selected.Exe)"
    Write-Output "Source: $($manifest.sourceCommit)"
    Write-Output "Built: $($manifest.builtAt)"
    Write-Output "Version: $($manifest.version)"
    return
  }
  if ($Preview) {
    Start-Process -FilePath $selected.Exe -WorkingDirectory $selected.Dir -ArgumentList '--preview'
  } else {
    Start-Process -FilePath $selected.Exe -WorkingDirectory $selected.Dir
  }
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
