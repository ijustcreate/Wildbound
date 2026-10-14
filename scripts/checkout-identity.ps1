function Get-WildboundCheckoutCommit {
  param([Parameter(Mandatory = $true)][string]$Root)
  # Launching a packaged game must not require Git on Explorer's PATH.
  # Read the same HEAD/loose/packed refs Git uses, including managed worktrees.
  $gitPath = Join-Path $Root '.git'
  if (Test-Path -LiteralPath $gitPath -PathType Leaf) {
    $pointer = (Get-Content -LiteralPath $gitPath -Raw).Trim()
    if ($pointer -notmatch '^gitdir:\s*(.+)$') { throw 'Invalid checkout Git directory pointer.' }
    $pointerPath = $Matches[1]
    $gitPath = if ([IO.Path]::IsPathRooted($pointerPath)) { [IO.Path]::GetFullPath($pointerPath) } else { [IO.Path]::GetFullPath((Join-Path $Root $pointerPath)) }
  }
  if (-not (Test-Path -LiteralPath $gitPath -PathType Container)) { throw 'Checkout Git metadata is missing; its desktop build identity cannot be verified.' }
  $commonPath = $gitPath
  $commonFile = Join-Path $gitPath 'commondir'
  if (Test-Path -LiteralPath $commonFile) {
    $commonPointer = (Get-Content -LiteralPath $commonFile -Raw).Trim()
    $commonPath = if ([IO.Path]::IsPathRooted($commonPointer)) { [IO.Path]::GetFullPath($commonPointer) } else { [IO.Path]::GetFullPath((Join-Path $gitPath $commonPointer)) }
  }
  $value = (Get-Content -LiteralPath (Join-Path $gitPath 'HEAD') -Raw).Trim()
  for ($depth = 0; $depth -lt 8; $depth++) {
    if ($value -match '^(?:[a-fA-F0-9]{40}|[a-fA-F0-9]{64})$') { return $value.ToLowerInvariant() }
    if ($value -notmatch '^ref:\s*(refs/[^\s]+)$') { throw 'Invalid checkout HEAD; rebuild identity could not be verified.' }
    $reference = $Matches[1]
    if ($reference.Contains('..') -or $reference.Contains('\')) { throw 'Invalid checkout reference.' }
    $found = $false
    foreach ($directory in @($gitPath, $commonPath) | Select-Object -Unique) {
      $loose = Join-Path $directory $reference
      if (Test-Path -LiteralPath $loose -PathType Leaf) { $value = (Get-Content -LiteralPath $loose -Raw).Trim(); $found = $true; break }
      $packed = Join-Path $directory 'packed-refs'
      if (Test-Path -LiteralPath $packed -PathType Leaf) {
        foreach ($line in Get-Content -LiteralPath $packed) {
          if ($line -match ('^([a-fA-F0-9]{40}|[a-fA-F0-9]{64}) ' + [Regex]::Escape($reference) + '$')) { $value = $Matches[1]; $found = $true; break }
        }
        if ($found) { break }
      }
    }
    if (-not $found) { throw "Checkout reference $reference could not be resolved." }
  }
  throw 'Checkout has a circular symbolic reference.'
}
