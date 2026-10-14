param([string]$ConfigPath, [string]$DesktopPath = [Environment]::GetFolderPath('Desktop'))
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (-not $ConfigPath) { $ConfigPath = Join-Path $root 'server-data\config.json' }
$ConfigPath = [IO.Path]::GetFullPath($ConfigPath)
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$node = if ($nodeCommand) { $nodeCommand.Source } else { $null }
if (-not $node) {
  $candidates = @(
    (Join-Path $env:ProgramFiles 'nodejs\node.exe'),
    (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links\node.exe')
  )
  $packageRoot = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
  if (Test-Path -LiteralPath $packageRoot) {
    $candidates += @(Get-ChildItem -Path (Join-Path $packageRoot 'OpenJS.NodeJS*\node-*\node.exe') -File -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
  }
  $node = $candidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
}
if (-not $node) { throw 'Node.js is missing. Install Node.js before starting the persistent server.' }
$electron = Join-Path $root 'node_modules\electron\dist\electron.exe'
if (-not (Test-Path -LiteralPath $electron)) { throw 'Electron is missing. Install the project dependencies before opening Server Control.' }
if (-not (Test-Path -LiteralPath (Join-Path $root 'node_modules\ws'))) { throw 'Server dependencies are missing. Install the project dependencies.' }
Push-Location $root
try {
  if (-not (Test-Path -LiteralPath $ConfigPath)) {
    & $node 'server/start.mjs' --config $ConfigPath --init --init-only
    if ($LASTEXITCODE -ne 0) { throw 'Server configuration could not be initialized.' }
  }
  $config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
  if ($config.adminHost -notin @('127.0.0.1','localhost','::1')) { throw 'Admin control must remain on loopback.' }
  $adminUrl = "http://127.0.0.1:$($config.adminPort)/admin/status"
  if ($config.adminHost -eq '::1') { $adminUrl = "http://[::1]:$($config.adminPort)/admin/status" }
  $headers = @{ 'x-wildbound-admin-token' = $config.adminToken }
  $status = $null
  try { $status = Invoke-RestMethod -Uri $adminUrl -Headers $headers -TimeoutSec 2 } catch {}
  if (-not $status) {
    $logRoot = Split-Path -Parent $ConfigPath
    $arguments = '"' + (Join-Path $root 'server\start.mjs') + '" --config "' + $ConfigPath + '"'
    $serverProcess = Start-Process -FilePath $node -ArgumentList $arguments -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logRoot 'server-stdout.log') -RedirectStandardError (Join-Path $logRoot 'server-stderr.log')
    $deadline = [DateTime]::UtcNow.AddSeconds(20)
    while (-not $status -and [DateTime]::UtcNow -lt $deadline) {
      if ($serverProcess.HasExited) { throw "Server exited. Read $(Join-Path $logRoot 'server-stderr.log')." }
      Start-Sleep -Milliseconds 300
      try { $status = Invoke-RestMethod -Uri $adminUrl -Headers $headers -TimeoutSec 1 } catch {}
    }
    if (-not $status) { throw "Server did not become ready. Read $(Join-Path $logRoot 'server-stderr.log')." }
  }
  if (-not $status.localHealth) { throw 'The server reports a simulation error. Inspect its log before playing.' }
  if (Test-Path -LiteralPath $DesktopPath -PathType Container) {
    $shortcutShell = New-Object -ComObject WScript.Shell
    $controlShortcut = $shortcutShell.CreateShortcut((Join-Path $DesktopPath 'Wildbound Server Control.lnk'))
    $controlShortcut.TargetPath = Join-Path $root 'Server Control.cmd'
    $defaultConfigPath = Join-Path $root 'server-data\config.json'
    $controlShortcut.Arguments = if ($ConfigPath -eq $defaultConfigPath) { '' } else { '-ConfigPath "' + $ConfigPath + '"' }
    $controlShortcut.WorkingDirectory = $root
    $controlShortcut.IconLocation = (Join-Path $root 'assets\wildbound-icon.ico') + ',0'
    $controlShortcut.Description = 'Start the persistent Wildbound server and open its control panel'
    $controlShortcut.Save()
  }
  $panelArguments = '"' + (Join-Path $root 'server-control-main.cjs') + '" --config "' + $ConfigPath + '"'
  Start-Process -FilePath $electron -ArgumentList $panelArguments -WorkingDirectory $root -WindowStyle Hidden
  Write-Output "Persistent server ready: $($status.localAddress)"
} finally { Pop-Location }
