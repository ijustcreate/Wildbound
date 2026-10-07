param([switch]$Check)
$ErrorActionPreference = 'Stop'
try {
  $root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
  $identity = Get-Content -Raw -LiteralPath (Join-Path $root 'test-output\event-variety-build.json') | ConvertFrom-Json
  $exe = [IO.Path]::GetFullPath([string]$identity.executable)
  $packageDir = [IO.Path]::GetFullPath([string]$identity.packageDir)
  $allowedRoot = [IO.Path]::GetFullPath((Join-Path $root 'dist\event-variety-'))
  if (-not $packageDir.StartsWith($allowedRoot, [StringComparison]::OrdinalIgnoreCase) -or
      $exe -ne (Join-Path $packageDir 'Wildbound.exe')) { throw 'Invalid event-variety build target.' }
  $manifestPath = Join-Path $packageDir 'wildbound-build.json'
  if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) { throw "Missing executable: $exe" }
  $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
  if ($manifest.variant -ne 'Varied Events Test' -or $manifest.eventDirectorVersion -ne 2 -or $manifest.preview) {
    throw 'This is not the verified event-variety build.'
  }
  if ($Check) {
    Write-Output "Build: $exe"
    Write-Output "Built: $($manifest.builtAt)"
    Write-Output "Source: $($manifest.sourceCommit) (modified source)"
    Write-Output 'Profile: existing normal Wildbound saves; no --preview'
    return
  }
  Start-Process -FilePath $exe -WorkingDirectory $packageDir
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
