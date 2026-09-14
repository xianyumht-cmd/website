const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const deployScript = fs.readFileSync(path.join(repoRoot, 'scripts/deploy-local.ps1'), 'utf8');
const batchEntrypoint = fs.readFileSync(path.join(repoRoot, 'deploy-local.bat'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const deployWorkflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/deploy.yml'), 'utf8');

describe('local deployment safety contract', () => {
    test('has Windows and npm entrypoints', () => {
        expect(packageJson.scripts['deploy:local']).toContain('powershell');
        expect(packageJson.scripts['deploy:local']).toContain('scripts/deploy-local.ps1');
        expect(batchEntrypoint).toContain('scripts\\deploy-local.ps1');
        expect(batchEntrypoint).toContain('exit /b %EXIT_CODE%');
    });

    test('requires the source branch and blocks real dirty-tree deployment', () => {
        expect(deployScript).toContain("symbolic-ref', '--quiet', '--short', 'HEAD");
        expect(deployScript).toContain("if ($branch -ne 'source')");
        expect(deployScript).toContain('Commit the source changes before production deployment.');
        expect(deployScript).toContain('Untracked files outside design-previews/ and output/');
    });

    test('checks both remote branches and classifies source relation', () => {
        expect(deployScript).toContain("@('fetch', 'origin', 'source', 'main')");
        expect(deployScript).toContain('refs/remotes/origin/source');
        expect(deployScript).toContain('refs/remotes/origin/main');
        expect(deployScript).toContain("'behind'");
        expect(deployScript).toContain("'diverged'");
    });

    test('runs the mandatory validation and rejects incomplete dist', () => {
        expect(deployScript).toContain("@('run', 'test:unit')");
        expect(deployScript).toContain("@('run', 'build')");
        expect(deployScript).toContain('Build output directory was not generated');
        expect(deployScript).toContain('Build output is incomplete');
        expect(deployScript).toContain('Build output is unexpectedly small');
    });

    test('uses an isolated detached worktree and validates its temporary path', () => {
        expect(deployScript).toContain("'worktree', 'add', '--detach'");
        expect(deployScript).toContain('Assert-SafeWorktreePath');
        expect(deployScript).toContain("'worktree', 'remove', '--force'");
        expect(deployScript).not.toMatch(/checkout[^\r\n]*\bmain\b/i);
    });

    test('mirrors dist, removes obsolete files, and recreates nojekyll', () => {
        expect(deployScript).toContain('Remove-Item -LiteralPath $item.FullName -Recurse -Force');
        expect(deployScript).toContain('Copy-Item -LiteralPath $item.FullName -Destination $destination -Recurse -Force');
        expect(deployScript).toContain('peaceiris/actions-gh-pages creates .nojekyll');
        expect(deployScript).toContain("New-Item -ItemType File -Path $noJekyllPath");
    });

    test('never force-pushes and makes dry-run visibly non-mutating', () => {
        expect(deployScript).not.toMatch(/push[^\r\n]*(--force|-f\b)/i);
        expect(deployScript).toContain("'HEAD:refs/heads/source'");
        expect(deployScript).toContain("'HEAD:refs/heads/main'");
        expect(deployScript).toContain('DRY RUN - NOTHING WAS PUSHED TO MAIN');
    });

    test('creates traceable non-empty deployment commits only when output changes', () => {
        expect(deployScript).toContain('Deploy source $shortSourceSha');
        expect(deployScript).toContain('Source SHA: $FullSourceSha');
        expect(deployScript).toContain('} elseif ($diff.HasChanges) {');
        expect(deployScript).toContain('No production changes to deploy; no empty commit was created.');
    });

    test('keeps automatic source deployment behind required quality gates', () => {
        expect(deployWorkflow).toContain('workflow_dispatch:');
        expect(deployWorkflow).toContain('  push:');
        expect(deployWorkflow).toContain('      - source');
        expect(deployWorkflow).not.toContain('continue-on-error: true');
        expect(deployWorkflow).toContain('run: npm run lint');
        expect(deployWorkflow).toContain('run: npm run test:unit');
        expect(deployWorkflow).toContain('run: npm run test:smoke');
        expect(deployWorkflow).toContain('force_orphan: false');
    });
});
