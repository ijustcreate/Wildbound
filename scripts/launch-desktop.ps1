param([switch]$Check, [string]$BuildDirectory = '')

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
  if ($BuildDirectory) {
    $pinnedDir = if ([IO.Path]::IsPathRooted($BuildDirectory)) {
      [IO.Path]::GetFullPath($BuildDirectory)
    } else {
      [IO.Path]::GetFullPath((Join-Path $root $BuildDirectory))
    }
    $distPrefix = [IO.Path]::GetFullPath((Join-Path $root 'dist')) + [IO.Path]::DirectorySeparatorChar
    if (-not $pinnedDir.StartsWith($distPrefix, [StringComparison]::OrdinalIgnoreCase)) {
      throw 'An explicitly selected build must be inside this checkout''s dist directory.'
    }
    $pinnedManifestPath = Join-Path $pinnedDir 'wildbound-build.json'
    if (-not (Test-Path -LiteralPath $pinnedManifestPath -PathType Leaf)) {
      throw "Build manifest not found: $pinnedManifestPath"
    }
    $pinnedManifest = Get-Content -Raw -LiteralPath $pinnedManifestPath | ConvertFrom-Json
    if (-not [string]$pinnedManifest.version -or $pinnedManifest.preview -or
        [string]$pinnedManifest.sourceCommit -ne $commit -or
        -not (Test-Path -LiteralPath (Join-Path $pinnedDir 'Wildbound.exe') -PathType Leaf)) {
      throw 'The explicitly selected build must be a normal desktop package from this checkout commit.'
    }
    $selected = [pscustomobject]@{ Dir=$pinnedDir; Manifest=$pinnedManifest }
  }
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
