param(
  [switch]$Strict
)

$ErrorActionPreference = 'Stop'

function Print-KV {
  param([string]$Key,[string]$Value)
  $v = $Value
  if ($null -eq $v) { $v = '' }
  Write-Output ("{0}={1}" -f $Key,$v)
}

function Try-Run {
  param([string]$Name,[string[]]$Args)
  try {
    $out = & $Name @Args 2>&1 | Out-String
    return $out.Trim()
  } catch {
    return $null
  }
}

$report = [ordered]@{}
$report.timestamp = (Get-Date).ToString('o')
$report.user = $env:USERNAME
$report.cwd = (Get-Location).Path
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$toolsDir = Join-Path $repoRoot 'tools'

$cmds = @('node','npm','npx','git','java')
foreach ($c in $cmds) {
  try {
    $p = (Get-Command $c -ErrorAction Stop).Source
    $report["where_$c"] = $p
  } catch {
    $report["where_$c"] = $null
  }
}

$report.node_version = Try-Run -Name 'node' -Args @('-v')
$report.npm_version = Try-Run -Name 'npm' -Args @('-v')
$report.git_version = Try-Run -Name 'git' -Args @('--version')
$report.java_version = Try-Run -Name 'java' -Args @('-version')

$report.JAVA_HOME = $env:JAVA_HOME
$report.CHROME_PATH = $env:CHROME_PATH
$report.HOME = $env:HOME
$report.XDG_CONFIG_HOME = $env:XDG_CONFIG_HOME
$report.Path = $env:Path

$portableNodeDir = Join-Path $toolsDir 'node-v24.13.0-win-x64'
$portableNodeExe = Join-Path $portableNodeDir 'node.exe'
$portableNpmCmd = Join-Path $portableNodeDir 'npm.cmd'
if ((-not $report.where_node) -and (Test-Path -LiteralPath $portableNodeExe)) {
  $report.where_node_portable = $portableNodeExe
  $report.node_version_portable = Try-Run -Name $portableNodeExe -Args @('-v')
}
if ((-not $report.where_npm) -and (Test-Path -LiteralPath $portableNpmCmd)) {
  $report.where_npm_portable = $portableNpmCmd
  $report.npm_version_portable = Try-Run -Name $portableNpmCmd -Args @('-v')
}

$browserCandidates = @(
  $env:CHROME_PATH,
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
  'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
) | Where-Object { $_ -and $_.Trim().Length -gt 0 }
$browserPath = $browserCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if ($browserPath) { $report.browser_path = $browserPath }

foreach ($k in $report.Keys) {
  Print-KV -Key $k -Value ([string]$report[$k])
}

$missing = @()
foreach ($c in @('node','npm')) {
  if (-not $report["where_$c"]) {
    $portableKey = "where_${c}_portable"
    if (-not $report[$portableKey]) { $missing += $c }
  }
}

if ($Strict) {
  if (-not $env:JAVA_HOME) { $missing += 'JAVA_HOME' }
  if (-not $report.browser_path) { $missing += 'CHROME_PATH' }
}

if ($missing.Count -gt 0) {
  Write-Output ("MISSING=" + ($missing -join ','))
  exit 1
}

Write-Output 'OK=1'

