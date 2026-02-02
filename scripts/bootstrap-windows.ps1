param(
  [ValidateSet('auto','user','machine')]
  [string]$EnvScope = 'auto',
  [switch]$DryRun,
  [switch]$SkipChrome,
  [switch]$SkipGit,
  [switch]$SkipJava,
  [switch]$SkipNode
)

$ErrorActionPreference = 'Stop'

function Write-LogLine {
  param([string]$Message)
  $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss.fff'
  Write-Host "[$ts] $Message"
}

function Ensure-Dir {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Get-IsAdmin {
  try {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  } catch {
    return $false
  }
}

function Get-CommandPath {
  param([string]$Name)
  try {
    return (Get-Command $Name -ErrorAction Stop).Source
  } catch {
    return $null
  }
}

function Ensure-Winget {
  $winget = Get-CommandPath 'winget'
  if ($winget) { return $true }
  Write-LogLine 'winget not found. Install "App Installer" (Microsoft) first, then re-run.'
  return $false
}

function Winget-IsInstalled {
  param([string]$Id)
  $out = & winget list --id $Id -e 2>$null | Out-String
  return ($out -match [Regex]::Escape($Id))
}

function Winget-Install {
  param([string]$Id)
  if ($DryRun) {
    Write-LogLine "DryRun: winget install --id $Id"
    return
  }
  & winget install --id $Id -e --source winget --accept-package-agreements --accept-source-agreements | Out-Host
}

function Add-PathEntry {
  param(
    [string]$Entry,
    [ValidateSet('User','Machine')]
    [string]$Target
  )
  if (-not $Entry) { return }
  $current = [Environment]::GetEnvironmentVariable('Path', $Target)
  if (-not $current) { $current = '' }
  $parts = $current -split ';' | Where-Object { $_ -and $_.Trim().Length -gt 0 }
  $normalized = $parts | ForEach-Object { $_.Trim().TrimEnd('\') }
  $candidate = $Entry.Trim().TrimEnd('\')
  if ($normalized -contains $candidate) { return }
  $newValue = ($parts + $Entry) -join ';'
  if (-not $DryRun) {
    [Environment]::SetEnvironmentVariable('Path', $newValue, $Target)
  }
}

function Set-EnvVar {
  param(
    [string]$Name,
    [string]$Value,
    [ValidateSet('User','Machine')]
    [string]$Target
  )
  if (-not $DryRun) {
    [Environment]::SetEnvironmentVariable($Name, $Value, $Target)
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$logDir = Join-Path $repoRoot 'logs'
Ensure-Dir $logDir

$toolsDir = Join-Path $repoRoot 'tools'
Ensure-Dir $toolsDir

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$transcriptPath = Join-Path $logDir "win-bootstrap-$timestamp.log"

if (-not $DryRun) {
  Start-Transcript -Path $transcriptPath -Force | Out-Null
}

try {
  Write-LogLine "repo=$repoRoot"
  Write-LogLine "dryRun=$DryRun"

  $isAdmin = Get-IsAdmin
  $adminText = 'false'
  if ($isAdmin) { $adminText = 'true' }
  Write-LogLine "isAdmin=$adminText"

  $envTargets = @()
  switch ($EnvScope) {
    'user' { $envTargets = @('User') }
    'machine' { $envTargets = @('Machine') }
    default {
      if ($isAdmin) { $envTargets = @('Machine','User') } else { $envTargets = @('User') }
    }
  }

  $state = [ordered]@{
    createdAt = (Get-Date).ToString('o')
    envTargets = $envTargets
    installedWingetIds = @()
    previousEnv = @{
      User = @{
        Path = [Environment]::GetEnvironmentVariable('Path','User')
        JAVA_HOME = [Environment]::GetEnvironmentVariable('JAVA_HOME','User')
        CHROME_PATH = [Environment]::GetEnvironmentVariable('CHROME_PATH','User')
        HOME = [Environment]::GetEnvironmentVariable('HOME','User')
        XDG_CONFIG_HOME = [Environment]::GetEnvironmentVariable('XDG_CONFIG_HOME','User')
      }
      Machine = @{
        Path = [Environment]::GetEnvironmentVariable('Path','Machine')
        JAVA_HOME = [Environment]::GetEnvironmentVariable('JAVA_HOME','Machine')
        CHROME_PATH = [Environment]::GetEnvironmentVariable('CHROME_PATH','Machine')
        HOME = [Environment]::GetEnvironmentVariable('HOME','Machine')
        XDG_CONFIG_HOME = [Environment]::GetEnvironmentVariable('XDG_CONFIG_HOME','Machine')
      }
    }
  }

  $statePath = Join-Path $logDir "win-bootstrap-state-$timestamp.json"
  if (-not $DryRun) {
    ($state | ConvertTo-Json -Depth 6) | Set-Content -Path $statePath -Encoding UTF8
  }
  Write-LogLine "state=$statePath"

  $wingetAvailable = Ensure-Winget

  $packages = @()
  if (-not $SkipNode) { $packages += [pscustomobject]@{ id='OpenJS.NodeJS.LTS'; name='Node.js LTS' } }
  if (-not $SkipGit) { $packages += [pscustomobject]@{ id='Git.Git'; name='Git for Windows' } }
  if (-not $SkipJava) { $packages += [pscustomobject]@{ id='EclipseAdoptium.Temurin.17.JDK'; name='Temurin JDK 17' } }
  if (-not $SkipChrome) { $packages += [pscustomobject]@{ id='Google.Chrome'; name='Google Chrome' } }

  if ($wingetAvailable) {
    foreach ($pkg in $packages) {
      Write-LogLine ("checkInstall=" + $pkg.id)
      $installed = Winget-IsInstalled -Id $pkg.id
      if ($installed) {
        Write-LogLine "installed=true id=$($pkg.id)"
        continue
      }
      Write-LogLine "installed=false id=$($pkg.id) action=install"
      Winget-Install -Id $pkg.id
      $state.installedWingetIds += $pkg.id
      if (-not $DryRun) {
        ($state | ConvertTo-Json -Depth 6) | Set-Content -Path $statePath -Encoding UTF8
      }
    }
  }

  $userProfile = $env:USERPROFILE
  foreach ($t in $envTargets) {
    try {
      Set-EnvVar -Name 'HOME' -Value $userProfile -Target $t
      Set-EnvVar -Name 'XDG_CONFIG_HOME' -Value (Join-Path $userProfile '.config') -Target $t
      Add-PathEntry -Entry 'C:\Program Files\nodejs\' -Target $t
      Add-PathEntry -Entry 'C:\Program Files\Git\cmd\' -Target $t
    } catch {
      Write-LogLine ("envUpdateFailed target=" + $t + " err=" + $_.Exception.Message)
    }
  }

  $nodeExe = Get-CommandPath 'node'
  $portableNodeDir = Join-Path $toolsDir 'node-v24.13.0-win-x64'
  $portableNodeExe = Join-Path $portableNodeDir 'node.exe'
  if ((-not $nodeExe) -and (-not $SkipNode)) {
    if (-not (Test-Path -LiteralPath $portableNodeExe)) {
      $ver = 'v24.13.0'
      $zipName = "node-$ver-win-x64.zip"
      $zipPath = Join-Path $toolsDir $zipName
      $url = "https://nodejs.org/dist/$ver/$zipName"
      Write-LogLine "portableNodeDownload=$url"
      if (-not $DryRun) {
        Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
        Expand-Archive -Path $zipPath -DestinationPath $toolsDir -Force
      }
    }
    if (Test-Path -LiteralPath $portableNodeExe) {
      foreach ($t in $envTargets) {
        Add-PathEntry -Entry $portableNodeDir -Target $t
      }
      $env:Path = ($portableNodeDir + ';' + $env:Path)
      Write-LogLine "portableNodeReady=$portableNodeExe"
    } else {
      Write-LogLine "portableNodeMissing=$portableNodeExe"
    }
  }

  $javaExe = Get-CommandPath 'java'
  if ($javaExe) {
    $javaHomeGuess = Split-Path -Parent (Split-Path -Parent $javaExe)
    foreach ($t in $envTargets) {
      try {
        Set-EnvVar -Name 'JAVA_HOME' -Value $javaHomeGuess -Target $t
        Add-PathEntry -Entry (Join-Path $javaHomeGuess 'bin') -Target $t
      } catch {
        Write-LogLine ("javaEnvFailed target=" + $t + " err=" + $_.Exception.Message)
      }
    }
  }

  $chromeCandidates = @(
    'C:\Program Files\Google\Chrome\Application\chrome.exe',
    'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
  )
  $chromePath = $chromeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
  if (-not $chromePath) {
    $edgeCandidates = @(
      'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
      'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
    )
    $chromePath = $edgeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
  }
  if ($chromePath) {
    foreach ($t in $envTargets) {
      try { Set-EnvVar -Name 'CHROME_PATH' -Value $chromePath -Target $t } catch {}
    }
  }

  $env:HOME = $userProfile
  $env:XDG_CONFIG_HOME = Join-Path $userProfile '.config'
  if ($javaExe) { $env:JAVA_HOME = (Split-Path -Parent (Split-Path -Parent $javaExe)) }
  if ($chromePath) { $env:CHROME_PATH = $chromePath }

  Write-LogLine 'generateRollback=1'
  $rollbackPath = Join-Path $logDir "win-bootstrap-rollback-$timestamp.ps1"

  $rollbackContent = @'
param([string]$StatePath)
$ErrorActionPreference = 'Stop'
function Write-Line([string]$m){ $ts=Get-Date -Format 'yyyy-MM-dd HH:mm:ss.fff'; Write-Host ("[" + $ts + "] " + $m) }
if(-not $StatePath){ throw 'StatePath required' }
if(-not (Test-Path -LiteralPath $StatePath)){ throw ("State file not found: " + $StatePath) }
$s = Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json
foreach($scope in @('User','Machine')){
  if(-not $s.previousEnv.$scope){ continue }
  foreach($k in @('Path','JAVA_HOME','CHROME_PATH','HOME','XDG_CONFIG_HOME')){
    $v = $s.previousEnv.$scope.$k
    try { [Environment]::SetEnvironmentVariable($k, $v, $scope) } catch { Write-Line ("restoreFailed scope=" + $scope + " key=" + $k + " err=" + $_.Exception.Message) }
  }
}
if($s.installedWingetIds){
  foreach($id in $s.installedWingetIds){
    try { Write-Line ("uninstallTry id=" + $id); winget uninstall --id $id -e --accept-source-agreements | Out-Host } catch { Write-Line ("uninstallFailed id=" + $id + " err=" + $_.Exception.Message) }
  }
}
Write-Line 'done=1 reopenTerminal=1'
'@

  if (-not $DryRun) {
    Set-Content -Path $rollbackPath -Value $rollbackContent -Encoding UTF8
  }
  Write-LogLine "rollback=$rollbackPath"
  Write-LogLine 'done=1'
} finally {
  if (-not $DryRun) {
    Stop-Transcript | Out-Null
  }
}

