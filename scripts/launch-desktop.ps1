param([switch]$Check)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'checkout-identity.ps1')
try {
  $root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
  $version = [string](Get-Content -Raw (Join-Path $root 'package.json') | ConvertFrom-Json).version
  $commit = Get-WildboundCheckoutCommit -Root $root
  $candidates = @(Get-ChildItem -LiteralPath (Join-Path $root 'dist') -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "$version-*" } |
    ForEach-Object {
      $dir = Join-Path $_.FullName 'Wildbound-win32-x64'
      $manifestPath = Join-Path $dir 'wildbound-build.json'
      if (Test-Path -LiteralPath $manifestPath -PathType Leaf) {
        $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
        if ([string]$manifest.version -eq $version -and -not $manifest.preview -and [string]$manifest.sourceCommit -eq $commit -and (Test-Path -LiteralPath (Join-Path $dir 'Wildbound.exe') -PathType Leaf)) {
          [pscustomobject]@{ Dir=$dir; Manifest=$manifest }
        }
      }
    } | Sort-Object { $_.Manifest.builtAt } -Descending)
  $selected = $candidates | Select-Object -First 1
  if (-not $selected) { throw "No verified desktop build for source version $version and checkout $commit. Run node scripts/package.cjs from $root." }
  $buildDir = $selected.Dir
  $exe = Join-Path $buildDir 'Wildbound.exe'
  $manifest = $selected.Manifest
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
