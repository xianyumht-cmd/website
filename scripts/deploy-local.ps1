[CmdletBinding()]
param(
    [switch]$DryRun,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArguments
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$DistPath = Join-Path $RepoRoot 'dist'
$AllowedUntrackedRoots = @('design-previews', 'output')
$OriginalLocation = (Get-Location).Path
$WorktreePath = $null
$WorktreeCreated = $false
$CleanupFailed = $false
$RemoteFetchVerified = $false
$SourceSha = $null
$MainBaseSha = $null
$DeploymentCommitSha = $null

function Write-DeployStatus {
    param([string]$Message)
    Write-Host "[deploy-local] $Message"
}

function Write-DeployWarning {
    param([string]$Message)
    Write-Warning "[deploy-local] $Message"
}

function Invoke-NativeCommand {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [switch]$AllowFailure,
        [switch]$Quiet
    )

    $previousLocation = (Get-Location).Path
    $outputLines = @()
    $exitCode = 1
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        Set-Location -LiteralPath $WorkingDirectory
        # Native stderr is captured so a Git warning/fetch failure can be classified by exit code.
        $ErrorActionPreference = 'Continue'
        $outputLines = @(& $FilePath @Arguments 2>&1 | ForEach-Object {
            if ($_ -is [System.Management.Automation.ErrorRecord]) {
                $_.Exception.Message
            } else {
                "$_"
            }
        })
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
        Set-Location -LiteralPath $previousLocation
    }

    if (-not $Quiet) {
        foreach ($line in $outputLines) {
            Write-Host $line
        }
    }

    if (-not $AllowFailure -and $exitCode -ne 0) {
        $displayArguments = $Arguments -join ' '
        throw "Command failed with exit code ${exitCode}: $FilePath $displayArguments"
    }

    return [pscustomobject]@{
        ExitCode = $exitCode
        Output = $outputLines
    }
}

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [string]$WorkingDirectory = $RepoRoot,
        [switch]$AllowFailure,
        [switch]$Quiet
    )
    return Invoke-NativeCommand -FilePath 'git.exe' -Arguments $Arguments -WorkingDirectory $WorkingDirectory -AllowFailure:$AllowFailure -Quiet:$Quiet
}

function Invoke-Npm {
    param(
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [string]$WorkingDirectory = $RepoRoot
    )
    return Invoke-NativeCommand -FilePath 'npm.cmd' -Arguments $Arguments -WorkingDirectory $WorkingDirectory
}

function Get-GitValue {
    param(
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [string]$WorkingDirectory = $RepoRoot
    )
    $result = Invoke-Git -Arguments $Arguments -WorkingDirectory $WorkingDirectory -Quiet
    if ($result.ExitCode -ne 0) {
        throw "Unable to read Git value: git $($Arguments -join ' ')"
    }
    return ((@($result.Output) -join "`n").Trim())
}

function Get-CurrentBranch {
    $result = Invoke-Git -Arguments @('symbolic-ref', '--quiet', '--short', 'HEAD') -Quiet -AllowFailure
    if ($result.ExitCode -ne 0) {
        return $null
    }
    return ((@($result.Output) -join "`n").Trim())
}

function Get-SourceStatus {
    $result = Invoke-Git -Arguments @('status', '--porcelain=v1', '--untracked-files=all') -Quiet
    $tracked = @()
    $untracked = @()
    foreach ($line in @($result.Output)) {
        $text = [string]$line
        if ($text.Length -lt 2) { continue }
        $statusCode = $text.Substring(0, 2)
        $pathText = if ($text.Length -gt 3) { $text.Substring(3) } else { '' }
        if ($statusCode -eq '??') {
            $untracked += $pathText
        } elseif ($statusCode -ne '!!') {
            $tracked += $text
        }
    }

    return [pscustomobject]@{
        Tracked = @($tracked)
        Untracked = @($untracked)
    }
}

function Test-AllowedUntrackedPath {
    param([string]$PathText)
    $normalized = $PathText.Trim('"').Replace('\', '/')
    $rootName = $normalized.Split('/')[0]
    return $AllowedUntrackedRoots -contains $rootName
}

function Get-RemoteSha {
    param([Parameter(Mandatory = $true)][string]$RemoteRef)
    return Get-GitValue -Arguments @('rev-parse', '--verify', "$RemoteRef^{commit}")
}

function Get-SourceRelation {
    param([Parameter(Mandatory = $true)][string]$RemoteRef)
    $sourceHead = Get-GitValue -Arguments @('rev-parse', '--verify', 'HEAD^{commit}')
    $remoteHead = Get-RemoteSha -RemoteRef $RemoteRef
    if ($sourceHead -eq $remoteHead) {
        return 'up-to-date'
    }

    $behindCheck = Invoke-Git -Arguments @('merge-base', '--is-ancestor', 'HEAD', $RemoteRef) -AllowFailure -Quiet
    if ($behindCheck.ExitCode -eq 0) {
        return 'behind'
    }

    $aheadCheck = Invoke-Git -Arguments @('merge-base', '--is-ancestor', $RemoteRef, 'HEAD') -AllowFailure -Quiet
    if ($aheadCheck.ExitCode -eq 0) {
        return 'ahead'
    }
    return 'diverged'
}

function Update-RemoteRefs {
    $result = Invoke-Git -Arguments @('fetch', 'origin', 'source', 'main') -AllowFailure
    if ($result.ExitCode -eq 0) {
        $script:RemoteFetchVerified = $true
        Write-DeployStatus 'Fetched origin/source and origin/main.'
        return $true
    }

    $script:RemoteFetchVerified = $false
    if ($DryRun) {
        Write-DeployWarning 'Remote fetch failed; dry-run will use existing local origin refs for preview only.'
        return $false
    }
    throw 'Unable to fetch origin/source and origin/main; real deployment stopped before any push.'
}

function Assert-SafeGeneratedDirectory {
    param([Parameter(Mandatory = $true)][string]$PathToCheck)
    $expected = [System.IO.Path]::GetFullPath($DistPath).TrimEnd('\')
    $actual = [System.IO.Path]::GetFullPath($PathToCheck).TrimEnd('\')
    if ($actual -ne $expected) {
        throw "Refusing to remove unexpected generated path: $PathToCheck"
    }
}

function Remove-StaleBuildOutput {
    if (Test-Path -LiteralPath $DistPath) {
        Assert-SafeGeneratedDirectory -PathToCheck $DistPath
        Write-DeployStatus 'Removing the previous generated dist before validation/build.'
        Remove-Item -LiteralPath $DistPath -Recurse -Force
    }
}

function Assert-BuildOutput {
    if (-not (Test-Path -LiteralPath $DistPath -PathType Container)) {
        throw "Build output directory was not generated: $DistPath"
    }

    $requiredPaths = @(
        'index.html',
        '404.html',
        'about.html',
        'privacy.html',
        'down/nav/index.html',
        'down/games/index.html',
        'down/tdr/index.html',
        'assets'
    )
    foreach ($relativePath in $requiredPaths) {
        $candidatePath = Join-Path $DistPath ($relativePath.Replace('/', '\'))
        if (-not (Test-Path -LiteralPath $candidatePath)) {
            throw "Build output is incomplete; missing $relativePath"
        }
    }

    $fileCount = @(Get-ChildItem -LiteralPath $DistPath -Recurse -Force -File).Count
    if ($fileCount -lt 8) {
        throw "Build output is unexpectedly small: $fileCount files"
    }
    Write-DeployStatus "Build output verified: $fileCount files under dist."
}

function Assert-SafeWorktreePath {
    param([Parameter(Mandatory = $true)][string]$PathToCheck)
    $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\') + '\'
    $fullPath = [System.IO.Path]::GetFullPath($PathToCheck).TrimEnd('\') + '\'
    if (-not $fullPath.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to use an unscoped temporary worktree path: $PathToCheck"
    }
}

function New-DeploymentWorktree {
    param([Parameter(Mandatory = $true)][string]$BaseSha)
    $temporaryName = 'website-main-deploy-' + [Guid]::NewGuid().ToString('N')
    $candidatePath = Join-Path ([System.IO.Path]::GetTempPath()) $temporaryName
    Assert-SafeWorktreePath -PathToCheck $candidatePath
    if (Test-Path -LiteralPath $candidatePath) {
        throw "Temporary deployment path already exists: $candidatePath"
    }

    Invoke-Git -Arguments @('worktree', 'add', '--detach', $candidatePath, $BaseSha) | Out-Null
    $script:WorktreePath = $candidatePath
    $script:WorktreeCreated = $true
    Write-DeployStatus "Created isolated main worktree at $candidatePath from $BaseSha."
}

function Sync-ProductionTree {
    if (-not $WorktreeCreated -or [string]::IsNullOrWhiteSpace($WorktreePath)) {
        throw 'Deployment worktree was not created.'
    }
    Assert-SafeWorktreePath -PathToCheck $WorktreePath

    foreach ($item in @(Get-ChildItem -LiteralPath $WorktreePath -Force)) {
        if ($item.Name -eq '.git') { continue }
        Remove-Item -LiteralPath $item.FullName -Recurse -Force
    }

    foreach ($item in @(Get-ChildItem -LiteralPath $DistPath -Force)) {
        if ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
            throw "Refusing to copy a reparse point from dist: $($item.FullName)"
        }
        $destination = Join-Path $WorktreePath $item.Name
        Copy-Item -LiteralPath $item.FullName -Destination $destination -Recurse -Force
    }

    # peaceiris/actions-gh-pages creates .nojekyll when Jekyll processing is disabled.
    $noJekyllPath = Join-Path $WorktreePath '.nojekyll'
    if (-not (Test-Path -LiteralPath $noJekyllPath)) {
        New-Item -ItemType File -Path $noJekyllPath -Force | Out-Null
    }
    Write-DeployStatus 'Synchronized dist into the isolated production tree; obsolete files were removed.'
}

function Get-StagedProductionDiff {
    Invoke-Git -Arguments @('add', '--all') -WorkingDirectory $WorktreePath | Out-Null
    $quietResult = Invoke-Git -Arguments @('diff', '--cached', '--quiet') -WorkingDirectory $WorktreePath -AllowFailure -Quiet
    $diffResult = Invoke-Git -Arguments @('diff', '--cached', '--name-status', '--no-renames') -WorkingDirectory $WorktreePath -AllowFailure -Quiet
    return [pscustomobject]@{
        HasChanges = ($quietResult.ExitCode -ne 0)
        Lines = @($diffResult.Output)
    }
}

function Write-DiffPreview {
    param([Parameter(Mandatory = $true)]$Diff)
    $lines = @($Diff.Lines)
    if (-not $Diff.HasChanges) {
        Write-DeployStatus 'No production changes to deploy.'
        return
    }

    Write-DeployStatus "Production diff contains $($lines.Count) changed paths."
    foreach ($line in @($lines | Select-Object -First 30)) {
        Write-Host "[deploy-local]   $line"
    }
    if ($lines.Count -gt 30) {
        Write-Host "[deploy-local]   ... $($lines.Count - 30) more paths"
    }
}

function Get-DeploymentCommitBody {
    param([Parameter(Mandatory = $true)][string]$FullSourceSha)
    return @(
        "Source SHA: $FullSourceSha",
        'Build command: npm run build',
        'Deployment mode: local PowerShell worktree'
    ) -join "`n"
}

function Remove-DeploymentWorktree {
    if (-not $WorktreeCreated -or [string]::IsNullOrWhiteSpace($WorktreePath)) {
        return
    }

    try {
        Invoke-Git -Arguments @('worktree', 'remove', '--force', $WorktreePath) | Out-Null
        Write-DeployStatus 'Temporary deployment worktree cleaned up.'
    } catch {
        $script:CleanupFailed = $true
        Write-DeployWarning "Temporary worktree cleanup failed; inspect this exact path: $WorktreePath"
    }
}

$exitCode = 0
try {
    foreach ($argument in @($RemainingArguments)) {
        if ([string]::IsNullOrWhiteSpace($argument)) { continue }
        if ($argument -eq '--dry-run' -or $argument -eq '-dry-run') {
            $DryRun = $true
        } else {
            throw "Unsupported argument: $argument"
        }
    }

    Write-DeployStatus "Repository: $RepoRoot"
    $branch = Get-CurrentBranch
    if ([string]::IsNullOrWhiteSpace($branch)) {
        throw 'Current source checkout is detached; deployment requires the source branch.'
    }
    if ($branch -ne 'source') {
        throw "Current branch is '$branch'; deployment requires source."
    }
    $SourceSha = Get-GitValue -Arguments @('rev-parse', '--verify', 'HEAD^{commit}')
    Write-DeployStatus "Source branch verified: source at $SourceSha"

    $status = Get-SourceStatus
    $disallowedUntracked = @($status.Untracked | Where-Object { -not (Test-AllowedUntrackedPath -PathText $_) })
    if ($status.Tracked.Count -gt 0) {
        Write-DeployWarning "Tracked source changes detected: $($status.Tracked.Count)"
        foreach ($line in @($status.Tracked | Select-Object -First 20)) {
            Write-Host "[deploy-local]   $line"
        }
        if (-not $DryRun) {
            throw 'Commit the source changes before production deployment.'
        }
        Write-DeployWarning 'Dry-run continues for preview only; real deployment would stop on tracked changes.'
    }
    if ($disallowedUntracked.Count -gt 0) {
        Write-DeployWarning "Untracked paths outside the allowed preserved directories: $($disallowedUntracked.Count)"
        foreach ($line in @($disallowedUntracked | Select-Object -First 20)) {
            Write-Host "[deploy-local]   $line"
        }
        if (-not $DryRun) {
            throw 'Untracked files outside design-previews/ and output/ must be reviewed before production deployment.'
        }
    }
    $allowedOnly = @($status.Untracked | Where-Object { Test-AllowedUntrackedPath -PathText $_ })
    if ($allowedOnly.Count -gt 0) {
        Write-DeployStatus "Preserving allowed untracked paths under design-previews/ and output/: $($allowedOnly.Count)"
    }

    $fetchSucceeded = Update-RemoteRefs
    $sourceRemoteRef = 'refs/remotes/origin/source'
    $mainRemoteRef = 'refs/remotes/origin/main'
    $sourceRemoteSha = Get-RemoteSha -RemoteRef $sourceRemoteRef
    $sourceRelation = Get-SourceRelation -RemoteRef $sourceRemoteRef
    Write-DeployStatus "Source versus origin/source: $sourceRelation"
    if ($sourceRelation -eq 'behind' -or $sourceRelation -eq 'diverged') {
        if ($DryRun) {
            Write-DeployWarning "Dry-run detected unsafe source relation: $sourceRelation"
        } else {
            throw "Source is $sourceRelation relative to origin/source; deployment stopped."
        }
    }
    if (-not $fetchSucceeded -and -not $DryRun) {
        throw 'Remote refs were not verified; real deployment stopped.'
    }

    Remove-StaleBuildOutput
    Write-DeployStatus 'Checking dependency advisories at high severity and above.'
    Invoke-Npm -Arguments @('audit', '--audit-level=high') | Out-Null
    Write-DeployStatus 'Running mandatory local unit tests.'
    Invoke-Npm -Arguments @('run', 'test:unit') | Out-Null
    Write-DeployStatus 'Running the production build.'
    Invoke-Npm -Arguments @('run', 'build') | Out-Null
    Assert-BuildOutput

    $postBuildStatus = Get-SourceStatus
    if ($postBuildStatus.Tracked.Count -gt 0 -and -not $DryRun) {
        throw 'Tracked source files changed during validation; deployment stopped.'
    }

    if ($fetchSucceeded) {
        $sourceRemoteShaAfterBuild = Get-RemoteSha -RemoteRef $sourceRemoteRef
        $sourceRelationAfterBuild = Get-SourceRelation -RemoteRef $sourceRemoteRef
        if ($sourceRelationAfterBuild -eq 'behind' -or $sourceRelationAfterBuild -eq 'diverged') {
            if ($DryRun) {
                Write-DeployWarning "Dry-run detected source relation $sourceRelationAfterBuild after validation; real deployment would stop."
            } else {
                throw "Source became $sourceRelationAfterBuild relative to origin/source during validation."
            }
        }
        $sourceRelation = $sourceRelationAfterBuild
        $sourceRemoteSha = $sourceRemoteShaAfterBuild
    }

    if (-not $DryRun -and $sourceRelation -eq 'ahead') {
        Write-DeployStatus 'Source is ahead of origin/source; pushing normally before main publication.'
        Invoke-Git -Arguments @('push', 'origin', 'HEAD:refs/heads/source') | Out-Null
        Write-DeployStatus 'Source push completed without force options.'
    } elseif ($DryRun -and $sourceRelation -eq 'ahead') {
        Write-DeployStatus 'DRY RUN: source is ahead; a normal source push would be required, but none will run.'
    }

    if (-not $fetchSucceeded -and $DryRun) {
        Write-DeployWarning 'Main preview uses the existing local origin/main ref because remote fetch was unavailable.'
    }
    $MainBaseSha = Get-RemoteSha -RemoteRef $mainRemoteRef
    Write-DeployStatus "Main deployment base: origin/main at $MainBaseSha"
    New-DeploymentWorktree -BaseSha $MainBaseSha
    Sync-ProductionTree
    $diff = Get-StagedProductionDiff
    Write-DiffPreview -Diff $diff

    if ($fetchSucceeded) {
        $latestMainSha = Get-RemoteSha -RemoteRef $mainRemoteRef
        if ($latestMainSha -ne $MainBaseSha) {
            throw "origin/main changed during deployment preview ($MainBaseSha -> $latestMainSha); rerun deployment."
        }
    }

    if ($DryRun) {
        Write-DeployStatus "Predicted source SHA: $SourceSha"
        if ($diff.HasChanges) {
            $shortSourceSha = $SourceSha.Substring(0, 7)
            Write-DeployStatus "Predicted deployment commit: Deploy source $shortSourceSha"
        }
        Write-Host 'DRY RUN - NOTHING WAS PUSHED TO MAIN'
    } elseif ($diff.HasChanges) {
        $shortSourceSha = $SourceSha.Substring(0, 7)
        $commitSubject = "Deploy source $shortSourceSha"
        $commitBody = Get-DeploymentCommitBody -FullSourceSha $SourceSha
        Invoke-Git -Arguments @('commit', '-m', $commitSubject, '-m', $commitBody) -WorkingDirectory $WorktreePath | Out-Null
        $DeploymentCommitSha = Get-GitValue -Arguments @('rev-parse', '--verify', 'HEAD^{commit}') -WorkingDirectory $WorktreePath
        Write-DeployStatus "Created deployment commit $DeploymentCommitSha in the isolated worktree."
        Invoke-Git -Arguments @('push', 'origin', 'HEAD:refs/heads/main') -WorkingDirectory $WorktreePath | Out-Null
        Write-DeployStatus 'Main push completed without force options.'
    } else {
        Write-DeployStatus 'No production changes to deploy; no empty commit was created.'
    }
} catch {
    $exitCode = 1
    Write-Error "[deploy-local] $($_.Exception.Message)"
} finally {
    Remove-DeploymentWorktree
    if ((Get-Location).Path -ne $OriginalLocation) {
        Set-Location -LiteralPath $OriginalLocation
    }
    if ($CleanupFailed) {
        $exitCode = 1
    }
}

if ($exitCode -eq 0) {
    if ($DryRun) {
        Write-DeployStatus 'Dry-run completed successfully.'
    } else {
        Write-DeployStatus 'Local deployment completed successfully.'
    }
}
exit $exitCode