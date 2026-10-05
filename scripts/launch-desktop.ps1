param([switch]$Check)

$ErrorActionPreference = 'Stop'
try {
  $root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
  $version = [string](Get-Content -Raw (Join-Path $root 'package.json') | ConvertFrom-Json).version
  $buildDir = Join-Path $root "dist\$version\Wildbound-win32-x64"
  $exe = Join-Path $buildDir 'Wildbound.exe'
  $manifestPath = Join-Path $buildDir 'wildbound-build.json'

  if (-not (Test-Path -LiteralPath $exe -PathType Leaf) -or -not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    throw "No verified desktop build for source version $version. Run node scripts/package.cjs from $root."
  }
  $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
  if ([string]$manifest.version -ne $version -or $manifest.preview) {
    throw "Build identity does not match source version $version. Rebuild with node scripts/package.cjs."
  }
  $commit = (& git -C $root rev-parse HEAD 2>$null)
  if ($LASTEXITCODE -eq 0 -and $commit -ne [string]$manifest.sourceCommit) {
    throw "The desktop build is from commit $($manifest.sourceCommit). This checkout is at $commit. Rebuild with node scripts/package.cjs."
  }
  if ($manifest.sourceDirty) {
    Write-Warning 'This build was packaged with modified tracked source. Its commit alone does not identify every change.'
  }
  if ($Check) {
    Write-Output "Build: $exe"
    Write-Output "Source: $($manifest.sourceCommit)"
    Write-Output "Built: $($manifest.builtAt)"
    return
  }
  Start-Process -FilePath $exe -WorkingDirectory $buildDir
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
