[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$ErrorActionPreference = 'Stop'
$script:Stage = 'startup'
$script:RepositoryRoot = Split-Path -Parent $PSScriptRoot
$script:CanonicalPath = Join-Path $script:RepositoryRoot 'src\assets\data\lol-version.json'
$script:AllowedUntrackedRoots = @('design-previews', 'output')
$script:DryRunAllowedUntrackedFiles = @(
    'onekeyup.cmd',
    'scripts/onekeyup.ps1',
    'tests/unit/onekeyup-script.test.js'
)
$script:ExpectedSourceBase = $null
$script:DryRun = $false
$script:NoPause = $false

function Write-Stage {
    param([string]$Message)
    Write-Host ('[onekeyup] ' + $Message)
}

function Parse-Arguments {
    foreach ($argument in @($Arguments)) {
        if ([string]::IsNullOrWhiteSpace($argument)) { continue }
        if ($argument -eq '--dry-run') {
            $script:DryRun = $true
        } elseif ($argument -eq '--no-pause') {
            $script:NoPause = $true
        } else {
            throw ('Unsupported argument: ' + $argument)
        }
    }
}

function Invoke-NativeCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [Parameter(Mandatory = $true)]
        [string[]]$NativeArguments,
        [switch]$CaptureOutput,
        [switch]$AllowFailure
    )

    if ($CaptureOutput) {
        $captured = @(& $FilePath @NativeArguments 2>&1)
        $exitCode = $LASTEXITCODE
        if ($exitCode -ne 0 -and -not $AllowFailure) {
            throw ($FilePath + ' failed with exit code ' + $exitCode)
        }
        return @($captured)
    }

    & $FilePath @NativeArguments
    $exitCode = $LASTEXITCODE
    $script:LastNativeExitCode = $exitCode
    if ($exitCode -ne 0 -and -not $AllowFailure) {
        throw ($FilePath + ' failed with exit code ' + $exitCode)
    }
    return
}

function Get-GitValue {
    param([string[]]$GitArguments)
    $output = @(Invoke-NativeCommand -FilePath 'git.exe' -NativeArguments $GitArguments -CaptureOutput)
    $lines = @($output | ForEach-Object { [string]$_ })
    return (($lines -join [Environment]::NewLine).Trim())
}

function Get-GitStatusLines {
    $output = @(Invoke-NativeCommand -FilePath 'git.exe' -NativeArguments @('status', '--porcelain', '--untracked-files=all') -CaptureOutput)
    return @($output | ForEach-Object { [string]$_ })
}

function Get-TrackedStatusLines {
    $allLines = @(Get-GitStatusLines)
    return @($allLines | Where-Object {
        $line = [string]$_
        $line.Length -lt 2 -or $line.Substring(0, 2) -ne '??'
    })
}

function Get-UntrackedStatusLines {
    $allLines = @(Get-GitStatusLines)
    return @($allLines | Where-Object {
        $line = [string]$_
        $line.Length -ge 2 -and $line.Substring(0, 2) -eq '??'
    })
}

function Get-StatusSnapshot {
    return ((@(Get-GitStatusLines) | ForEach-Object { [string]$_ }) -join [Environment]::NewLine)
}

function Get-StatusPath {
    param([string]$StatusLine)
    if ($StatusLine.Length -le 3) { return '' }
    $path = $StatusLine.Substring(3)
    if ($path -match ' -> ') {
        $path = $path.Substring($path.LastIndexOf(' -> ') + 4)
    }
    return $path.Replace('\', '/')
}

function Assert-UntrackedMaterial {
    $unexpected = @()
    foreach ($line in @(Get-UntrackedStatusLines)) {
        $path = Get-StatusPath ([string]$line)
        $allowed = $false
        foreach ($root in $script:AllowedUntrackedRoots) {
            if ($path -eq $root -or $path.StartsWith($root + '/')) {
                $allowed = $true
                break
            }
        }
        if ($script:DryRun -and $script:DryRunAllowedUntrackedFiles -contains $path) {
            $allowed = $true
        }
        if (-not $allowed) {
            $unexpected += $path
        }
    }

    if ($unexpected.Count -gt 0) {
        throw ('Unexpected untracked paths detected: ' + ($unexpected -join ', '))
    }

    $allowedLines = @(Get-UntrackedStatusLines)
    Write-Stage ('Preserving allowed untracked material: ' + $allowedLines.Count + ' file(s)')
}

function Invoke-SecureFetch {
    $maxAttempts = 3
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        $fetchArguments = @('fetch', 'origin', 'source', 'main')
        if ($attempt -gt 1) {
            $fetchArguments = @('-c', 'http.version=HTTP/1.1') + $fetchArguments
        }

        Write-Stage ('Fetching origin/source and origin/main (attempt ' + $attempt + '/' + $maxAttempts + ')')
        Invoke-NativeCommand -FilePath 'git.exe' -NativeArguments $fetchArguments -AllowFailure
        $exitCode = $script:LastNativeExitCode
        if ($exitCode -eq 0) {
            return
        }

        if ($attempt -lt $maxAttempts) {
            $backoff = $attempt * 10
            Write-Stage ('Secure fetch failed; retrying after ' + $backoff + ' seconds')
            Start-Sleep -Seconds $backoff
        }
    }

    throw 'Secure remote fetch failed after 3 attempts'
}

function Assert-RepositoryPreflight {
    param([switch]$AllowTrackedChanges)

    $script:Stage = 'repository preflight'
    $branch = Get-GitValue @('branch', '--show-current')
    if ($branch -ne 'source') {
        throw ('Current branch must be source; found ' + $branch)
    }

    Invoke-SecureFetch
    $head = Get-GitValue @('rev-parse', 'HEAD')
    $remoteSource = Get-GitValue @('rev-parse', 'origin/source')
    if ($head -ne $remoteSource) {
        throw ('Local source is not equal to origin/source. HEAD=' + $head + '; origin/source=' + $remoteSource)
    }
    $script:ExpectedSourceBase = $remoteSource

    Assert-UntrackedMaterial
    $tracked = @(Get-TrackedStatusLines)
    if (-not $AllowTrackedChanges -and $tracked.Count -gt 0) {
        $paths = @($tracked | ForEach-Object { Get-StatusPath ([string]$_) })
        throw ('Working tree contains tracked changes. Commit or resolve them before running onekeyup. Paths: ' + ($paths -join ', '))
    }
    if ($AllowTrackedChanges -and $tracked.Count -gt 0) {
        Write-Stage ('Dry-run is preserving existing tracked changes: ' + $tracked.Count + ' line(s)')
    }
}

function Get-CanonicalHash {
    if (-not (Test-Path -LiteralPath $script:CanonicalPath -PathType Leaf)) {
        throw ('Canonical file is missing: ' + $script:CanonicalPath)
    }
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.IO.File]::ReadAllBytes($script:CanonicalPath)
        return ([BitConverter]::ToString($sha256.ComputeHash($bytes))).Replace('-', '')
    } finally {
        $sha256.Dispose()
    }
}

function Read-Canonical {
    $raw = Get-Content -LiteralPath $script:CanonicalPath -Raw
    $data = $raw | ConvertFrom-Json
    if ($null -eq $data) { throw 'Canonical JSON is empty' }
    foreach ($field in @('version', 'update', 'next')) {
        $value = [string]$data.$field
        if ([string]::IsNullOrWhiteSpace($value)) {
            throw ('Canonical field is empty: ' + $field)
        }
    }
    if ([string]$data.version -notmatch '^\d{1,3}\.\d{1,3}$') {
        throw ('Canonical version is malformed: ' + [string]$data.version)
    }
    foreach ($dateField in @('update', 'next')) {
        if ([string]$data.$dateField -notmatch '^\d{4}-\d{2}-\d{2}$') {
            throw ('Canonical date is malformed: ' + $dateField)
        }
    }
    return $data
}

function Invoke-RequiredCommand {
    param(
        [string]$Label,
        [string]$FilePath,
        [string[]]$NativeArguments
    )
    $script:Stage = $Label
    Write-Stage $Label
    Invoke-NativeCommand -FilePath $FilePath -NativeArguments $NativeArguments -AllowFailure
    $exitCode = $script:LastNativeExitCode
    if ($exitCode -ne 0) {
        throw ($Label + ' failed with exit code ' + $exitCode)
    }
}

function Assert-CanonicalOnlyChanged {
    $tracked = @(Get-TrackedStatusLines)
    if ($tracked.Count -eq 0) { return $false }

    $paths = @($tracked | ForEach-Object { Get-StatusPath ([string]$_) })
    $unexpected = @($paths | Where-Object { $_ -ne 'src/assets/data/lol-version.json' })
    if ($unexpected.Count -gt 0 -or $paths.Count -ne 1) {
        throw ('Unexpected tracked changes after updater: ' + ($paths -join ', '))
    }
    return $true
}

function Assert-StagedCanonicalOnly {
    $staged = @(Invoke-NativeCommand -FilePath 'git.exe' -NativeArguments @('diff', '--cached', '--name-only') -CaptureOutput | ForEach-Object { ([string]$_).Trim() } | Where-Object { $_ -ne '' })
    if ($staged.Count -ne 1 -or $staged[0] -ne 'src/assets/data/lol-version.json') {
        throw ('Unexpected staged files: ' + ($staged -join ', '))
    }
}

function Run-DryRun {
    $script:Stage = 'dry-run integrity snapshot'
    $initialCanonicalHash = Get-CanonicalHash
    $initialHead = Get-GitValue @('rev-parse', 'HEAD')
    $initialSource = Get-GitValue @('rev-parse', 'origin/source')
    $initialMain = Get-GitValue @('rev-parse', 'origin/main')
    $initialStatus = Get-StatusSnapshot

    Invoke-RequiredCommand 'Updater dry-run' 'npm.cmd' @('run', 'update:lol-version', '--', '--dry-run')
    Invoke-RequiredCommand 'Unit tests' 'npm.cmd' @('run', 'test:unit')
    Invoke-RequiredCommand 'Production build' 'npm.cmd' @('run', 'build')
    Invoke-RequiredCommand 'NAV lifecycle Playwright' 'npx.cmd' @('playwright', 'test', 'tests/e2e/nav-version-lifecycle.spec.ts')
    Invoke-RequiredCommand 'Diff check' 'git.exe' @('diff', '--check')
    Invoke-RequiredCommand 'Deployment dry-run' 'npm.cmd' @('run', 'deploy:local', '--', '--dry-run')

    $finalCanonicalHash = Get-CanonicalHash
    $finalHead = Get-GitValue @('rev-parse', 'HEAD')
    $finalSource = Get-GitValue @('rev-parse', 'origin/source')
    $finalMain = Get-GitValue @('rev-parse', 'origin/main')
    $finalStatus = Get-StatusSnapshot

    if ($initialCanonicalHash -ne $finalCanonicalHash) { throw 'Dry-run changed lol-version.json' }
    if ($initialHead -ne $finalHead) { throw 'Dry-run changed the local source HEAD' }
    if ($initialSource -ne $finalSource) { throw 'Dry-run changed origin/source' }
    if ($initialMain -ne $finalMain) { throw 'Dry-run changed origin/main' }
    if ($initialStatus -ne $finalStatus) { throw 'Dry-run changed tracked or untracked repository state' }

    Write-Host '========================================'
    Write-Host 'ONEKEYUP DRY RUN COMPLETE'
    Write-Host 'NO SOURCE OR MAIN PUSH WAS PERFORMED'
    Write-Host '========================================'
}

function Test-ProductionMatchesSource {
    param([Parameter(Mandatory = $true)][string]$SourceSha)

    $subject = Get-GitValue @('log', '-1', '--format=%s', 'origin/main')
    if ($subject -eq ('deploy: ' + $SourceSha)) { return $true }

    $shortSource = $SourceSha.Substring(0, 7)
    if ($subject -ne ('Deploy source ' + $shortSource)) { return $false }

    $message = Get-GitValue @('log', '-1', '--format=%B', 'origin/main')
    $exactMetadataLine = 'Source SHA: ' + $SourceSha
    return @($message -split "[\r\n]+" | Where-Object { $_ -eq $exactMetadataLine }).Count -eq 1
}

function Run-NormalMaintenance {
    Assert-RepositoryPreflight
    $baseSource = $script:ExpectedSourceBase

    $script:Stage = 'updater dry-run'
    $beforeUpdaterHash = Get-CanonicalHash
    Invoke-RequiredCommand 'Updater dry-run' 'npm.cmd' @('run', 'update:lol-version', '--', '--dry-run')
    if ($beforeUpdaterHash -ne (Get-CanonicalHash)) {
        throw 'Updater dry-run changed lol-version.json'
    }

    Invoke-RequiredCommand 'Real LOL updater' 'npm.cmd' @('run', 'update:lol-version')
    $hasCanonicalUpdate = Assert-CanonicalOnlyChanged
    $localSource = Get-GitValue @('rev-parse', 'HEAD')
    $current = Read-Canonical
    $version = [string]$current.version
    $update = [string]$current.update
    $next = [string]$current.next

    if (-not $hasCanonicalUpdate) {
        if (Test-ProductionMatchesSource -SourceSha $localSource) {
            Write-Host '========================================'
            Write-Host 'ONEKEYUP COMPLETE'
            Write-Host 'LOL version is already current.'
            Write-Host 'Production is already deployed.'
            Write-Host ('Version: ' + [string]$current.version)
            Write-Host '========================================'
            return
        }
        Write-Stage 'LOL version is current, but production is behind source; retrying deployment'
    }

    if ($hasCanonicalUpdate) {
    Invoke-RequiredCommand 'Unit tests' 'npm.cmd' @('run', 'test:unit')
    Invoke-RequiredCommand 'Production build' 'npm.cmd' @('run', 'build')
    Invoke-RequiredCommand 'NAV lifecycle Playwright' 'npx.cmd' @('playwright', 'test', 'tests/e2e/nav-version-lifecycle.spec.ts')
    Invoke-RequiredCommand 'Diff check' 'git.exe' @('diff', '--check')

    $script:Stage = 'safe staging'
    Invoke-NativeCommand -FilePath 'git.exe' -NativeArguments @('add', '--', 'src/assets/data/lol-version.json')
    Assert-StagedCanonicalOnly

    $script:Stage = 'source commit'
    $commitMessage = 'chore(nav): update LOL version to ' + $version
    Invoke-NativeCommand -FilePath 'git.exe' -NativeArguments @('commit', '-m', $commitMessage)
    $localSource = Get-GitValue @('rev-parse', 'HEAD')

    $script:Stage = 'second remote source check'
    Invoke-SecureFetch
    $remoteSourceBeforePush = Get-GitValue @('rev-parse', 'origin/source')
    if ($remoteSourceBeforePush -ne $baseSource) {
        throw ('Remote source changed during maintenance. Reconciliation is required before push. origin/source=' + $remoteSourceBeforePush)
    }

    $script:Stage = 'source push'
    Invoke-NativeCommand -FilePath 'git.exe' -NativeArguments @('push', 'origin', 'source') -AllowFailure
    $pushCode = $script:LastNativeExitCode
    if ($pushCode -ne 0) {
        Write-Stage 'Source push returned an error; verifying remote state once without retrying the push'
        Invoke-SecureFetch
        $remoteAfterFailedPush = Get-GitValue @('rev-parse', 'origin/source')
        if ($remoteAfterFailedPush -ne $localSource) {
            throw 'Source push failed and origin/source does not equal local HEAD'
        }
    }

    Invoke-SecureFetch
    if ((Get-GitValue @('rev-parse', 'origin/source')) -ne $localSource) {
        throw 'origin/source does not equal local source HEAD after push'
    }
    } else {
        # A retry must validate the existing source before deploying and never create another commit.
        Invoke-RequiredCommand 'Unit tests' 'npm.cmd' @('run', 'test:unit')
        Invoke-RequiredCommand 'Production build' 'npm.cmd' @('run', 'build')
        Invoke-RequiredCommand 'NAV lifecycle Playwright' 'npx.cmd' @('playwright', 'test', 'tests/e2e/nav-version-lifecycle.spec.ts')
        Invoke-RequiredCommand 'Diff check' 'git.exe' @('diff', '--check')
    }

    $script:Stage = 'deployment dry-run'
    Invoke-NativeCommand -FilePath 'npm.cmd' -NativeArguments @('run', 'deploy:local', '--', '--dry-run') -AllowFailure
    $deployDryRunCode = $script:LastNativeExitCode
    if ($deployDryRunCode -ne 0) {
        if ($hasCanonicalUpdate) { Write-Host 'SOURCE UPDATE WAS PUSHED' }
        else { Write-Host 'SOURCE WAS ALREADY PUSHED' }
        Write-Host 'MAIN NOT DEPLOYED'
        throw 'Deployment dry-run failed'
    }

    $script:Stage = 'real local deployment'
    Invoke-NativeCommand -FilePath 'npm.cmd' -NativeArguments @('run', 'deploy:local') -AllowFailure
    $deployCode = $script:LastNativeExitCode
    if ($deployCode -ne 0) {
        if ($hasCanonicalUpdate) { Write-Host 'SOURCE UPDATE WAS PUSHED' }
        else { Write-Host 'SOURCE WAS ALREADY PUSHED' }
        Write-Host 'PRODUCTION MAIN DEPLOYMENT FAILED'
        throw 'Production deployment failed'
    }

    $script:Stage = 'final remote verification'
    Invoke-SecureFetch
    $finalSource = Get-GitValue @('rev-parse', 'origin/source')
    $finalMain = Get-GitValue @('rev-parse', 'origin/main')
    if ($finalSource -ne $localSource) { throw 'Final origin/source verification failed' }

    if (-not (Test-ProductionMatchesSource -SourceSha $localSource)) {
        throw ('Production main does not identify source ' + $localSource)
    }

    $branch = Get-GitValue @('branch', '--show-current')
    if ($branch -ne 'source') { throw 'Final local branch is not source' }
    if ((@(Get-TrackedStatusLines)).Count -ne 0) { throw 'Final tracked source tree is not clean' }

    $tempRoot = [System.IO.Path]::GetTempPath()
    $remainingWorktrees = @(Get-ChildItem -LiteralPath $tempRoot -Directory -Filter 'website-main-deploy-*' -ErrorAction SilentlyContinue)
    if ($remainingWorktrees.Count -ne 0) {
        throw ('Temporary deployment worktrees remain: ' + $remainingWorktrees.Count)
    }

    Write-Host '========================================'
    Write-Host 'ONEKEYUP COMPLETE'
    Write-Host ('Version: ' + $version)
    Write-Host ('Update: ' + $update)
    Write-Host ('Next: ' + $next)
    Write-Host ('Source: ' + $localSource)
    Write-Host ('Main: ' + $finalMain)
    Write-Host 'Production: deployed'
    Write-Host '========================================'
}

try {
    Parse-Arguments
    Set-Location -LiteralPath $script:RepositoryRoot

    if ($script:DryRun) {
        Assert-RepositoryPreflight -AllowTrackedChanges
        Run-DryRun
    } else {
        Run-NormalMaintenance
    }
    exit 0
} catch {
    Write-Host '========================================'
    Write-Host ('ONEKEYUP FAILED at stage: ' + $script:Stage)
    Write-Host ('Reason: ' + $_.Exception.Message)
    Write-Host '========================================'
    exit 1
}
