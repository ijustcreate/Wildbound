. (Join-Path $PSScriptRoot 'checkout-identity.ps1')

function Read-WildboundDesktopBuild {
  param([string]$Directory)

  $exe = Join-Path $Directory 'Wildbound.exe'
  $manifestPath = Join-Path $Directory 'wildbound-build.json'
  if (-not (Test-Path -LiteralPath $exe -PathType Leaf) -or
      -not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    return
  }
  try {
    $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
  } catch {
    return
  }

  $version = $null
  if ([string]$manifest.version -notmatch '^\d+\.\d+\.\d+$' -or
      -not [version]::TryParse([string]$manifest.version, [ref]$version)) {
    return
  }
  $sourceVersion = if ($manifest.sourceVersion) { [string]$manifest.sourceVersion } else { [string]$manifest.version }
  [pscustomobject]@{ Dir=$Directory; Exe=$exe; Manifest=$manifest; Version=$version; SourceVersion=$sourceVersion }
}

function Get-WildboundDesktopBuild {
  param([string]$Root, [string]$BuildDirectory, [switch]$Preview)

  $commit = Get-WildboundCheckoutCommit -Root $Root
  $dist = Join-Path $Root 'dist'
  $profile = if ($Preview) { 'preview' } else { 'normal' }

  if ($BuildDirectory) {
    $pinnedDir = if ([IO.Path]::IsPathRooted($BuildDirectory)) {
      [IO.Path]::GetFullPath($BuildDirectory)
    } else {
      [IO.Path]::GetFullPath((Join-Path $Root $BuildDirectory))
    }
    $distPrefix = [IO.Path]::GetFullPath($dist) + [IO.Path]::DirectorySeparatorChar
    if (-not $pinnedDir.StartsWith($distPrefix, [StringComparison]::OrdinalIgnoreCase)) {
      throw 'An explicitly selected build must be inside this checkout''s dist directory.'
    }
    $selected = Read-WildboundDesktopBuild -Directory $pinnedDir
    if (-not $selected -or [bool]$selected.Manifest.preview -ne [bool]$Preview -or
        [string]$selected.Manifest.sourceCommit -ne $commit) {
      throw "The explicitly selected build must be a verified $profile desktop package from this checkout commit: $pinnedDir"
    }
    return $selected
  }

  $sourceVersion = [string](Get-Content -Raw -LiteralPath (Join-Path $Root 'package.json') | ConvertFrom-Json).version
  $selected = Get-ChildItem -LiteralPath $dist -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^\d+\.\d+\.\d+$' -or $_.Name -like "$sourceVersion-*" -or
      ($Preview -and $_.Name -like 'night-hunt-*') } |
    ForEach-Object { Read-WildboundDesktopBuild -Directory (Join-Path $_.FullName 'Wildbound-win32-x64') } |
    Where-Object { $_.SourceVersion -eq $sourceVersion -and [string]$_.Manifest.sourceCommit -eq $commit -and
      [bool]$_.Manifest.preview -eq [bool]$Preview -and -not $_.Manifest.variant } |
    Sort-Object -Property Version, @{ Expression = { $_.Manifest.builtAt } } -Descending |
    Select-Object -First 1

  if (-not $selected) {
    $packCommand = if ($Preview) { 'node scripts/package.cjs --preview' } else { 'node scripts/package.cjs' }
    throw "No verified $profile desktop build for source version $sourceVersion and checkout $commit. Run $packCommand from $Root."
  }
  return $selected
}
