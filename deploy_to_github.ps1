[CmdletBinding()]
param(
    [switch]$DryRun
)

Write-Warning 'deploy_to_github.ps1 is retained as a compatibility wrapper. Use deploy-local.ps1 or deploy-local.bat.'
& (Join-Path $PSScriptRoot 'scripts\deploy-local.ps1') -DryRun:$DryRun
exit $LASTEXITCODE
