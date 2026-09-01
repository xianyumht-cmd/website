const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const cmdPath = path.join(repoRoot, 'onekeyup.cmd');
const powershellPath = path.join(repoRoot, 'scripts', 'onekeyup.ps1');

const cmd = fs.readFileSync(cmdPath, 'utf8');
const powershell = fs.readFileSync(powershellPath, 'utf8');

describe('Windows one-click LOL maintenance entrypoint', () => {
    test('has the required CMD entrypoint and Windows PowerShell invocation', () => {
        expect(fs.existsSync(cmdPath)).toBe(true);
        expect(cmd).toContain('@echo off');
        expect(cmd).toContain('setlocal');
        expect(cmd).toContain('cd /d "%ONEKEYUP_REPO%"');
        expect(cmd).toMatch(/powershell\.exe/i);
        expect(cmd).toContain('-NoProfile');
        expect(cmd).toContain('-ExecutionPolicy Bypass');
        expect(cmd).toContain('scripts\\onekeyup.ps1');
        expect(cmd).toContain('%*');
        expect(cmd).toContain('exit /b');
        expect(cmd).toContain('pause');
    });

    test('requires source and checks tracked cleanliness while preserving user material', () => {
        expect(powershell).toContain("$branch -ne 'source'");
        expect(powershell).toContain('Working tree contains tracked changes');
        expect(powershell).toContain("'design-previews', 'output'");
        expect(powershell).toContain("@('status', '--porcelain'");
        expect(powershell).not.toContain('git clean');
        expect(powershell).not.toContain('git reset --hard');
    });

    test('runs updater dry-run before real update and enforces the canonical allowlist', () => {
        const dryRunIndex = powershell.indexOf("@('run', 'update:lol-version', '--', '--dry-run')");
        const realUpdateIndex = powershell.indexOf("@('run', 'update:lol-version')");
        expect(dryRunIndex).toBeGreaterThanOrEqual(0);
        expect(realUpdateIndex).toBeGreaterThan(dryRunIndex);
        expect(powershell).toContain("'src/assets/data/lol-version.json'");
        expect(powershell).toContain('Unexpected tracked changes after updater');
    });

    test('runs validation before staging and uses only the canonical file', () => {
        const stageIndex = powershell.indexOf("@('add', '--', 'src/assets/data/lol-version.json')");
        expect(stageIndex).toBeGreaterThanOrEqual(0);
        expect(powershell.indexOf("@('run', 'test:unit')")).toBeLessThan(stageIndex);
        expect(powershell.indexOf("@('run', 'build')")).toBeLessThan(stageIndex);
        expect(powershell.indexOf("'tests/e2e/nav-version-lifecycle.spec.ts'")).toBeLessThan(stageIndex);
        expect(powershell.indexOf("@('diff', '--check')")).toBeLessThan(stageIndex);
        expect(powershell).toContain('Assert-StagedCanonicalOnly');
        expect(powershell).not.toContain('git add .');
        expect(powershell).not.toContain('git add -A');
        expect(powershell).not.toContain('git commit -a');
    });

    test('uses normal push and the existing deployment command only', () => {
        expect(powershell).toContain("@('push', 'origin', 'source')");
        expect(powershell).not.toMatch(/git[^\r\n]*push[^\r\n]*(--force|-f)/i);
        expect(powershell).toContain("@('run', 'deploy:local', '--', '--dry-run')");
        expect(powershell).toContain("@('run', 'deploy:local')");
        expect(powershell).not.toMatch(/GitHub Actions|workflow_dispatch/i);
    });

    test('has bounded secure fetch retry and no TLS bypass or PowerShell 7-only syntax', () => {
        expect(powershell).toContain('$maxAttempts = 3');
        expect(powershell).toContain("'http.version=HTTP/1.1'");
        expect(powershell).not.toMatch(/GIT_SSL_NO_VERIFY|sslVerify\s*=\s*false|NODE_TLS_REJECT_UNAUTHORIZED|rejectUnauthorized\s*:\s*false/i);
        expect(powershell).not.toContain('&&');
        expect(powershell).not.toContain('||');
        expect(powershell).not.toMatch(/\?\?\s*=/);
        expect(powershell).not.toMatch(/ForEach-Object\s+-Parallel|ConvertFrom-Json\s+-AsHashtable|\$PSStyle/);
    });

    test('keeps dry-run free of writes and reports both dry-run and no-update outcomes', () => {
        expect(powershell).toContain('ONEKEYUP DRY RUN COMPLETE');
        expect(powershell).toContain('NO SOURCE OR MAIN PUSH WAS PERFORMED');
        expect(powershell).toContain('Dry-run changed lol-version.json');
        expect(powershell).toContain('LOL version is already current.');
        expect(powershell).toContain("$script:DryRun");
        expect(powershell).toContain("$script:NoPause");
    });

    test('reports a pushed-source and failed-main partial state', () => {
        expect(powershell).toContain('SOURCE UPDATE WAS PUSHED');
        expect(powershell).toContain('PRODUCTION MAIN DEPLOYMENT FAILED');
        expect(powershell).toContain('Deploy source ');
    });
});
