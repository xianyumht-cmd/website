# Operations

## Performance validation

### Local regression threshold

Run:

```text
npm run build
npm run test:perf
```

This keeps the existing deterministic local Lighthouse threshold checks for `/down/nav/` and `/down/tdr/`.

### Real production performance audit

Run:

```text
npm run test:perf:prod
```

Default production origin:

```text
https://xn--8pv109c.top
```

The production audit covers:

- `/`
- `/down/nav/index.html`
- `/down/games/index.html`

The command writes a Lighthouse JSON report under `logs/`. It is intentionally a measurement command rather than a hard release threshold because real network and third-party services vary between runs.

To audit another deployed origin, set `PRODUCTION_BASE_URL` before running the command. `CHROME_PATH` remains supported; otherwise the script uses Playwright Chromium when available.

## Performance policy

- Treat actual visitor speed, mobile responsiveness, broken core paths, and unnecessary third-party blocking as high-value issues.
- Do not optimize purely for smaller source files when production gzip/brotli size is already small and the user-visible bottleneck is elsewhere.
- Keep hashed `/assets/*` long-cache behavior unless production evidence shows a cache problem.
- Third-party analytics and visitor widgets should not sit on the HTML parsing/first-render critical path.
## Local deployment

Production publication is now designed to run locally. GitHub Actions is not required for deployment; the legacy workflow is manual-only.

## Before a real deployment

1. Commit the tracked source changes on `source`.
2. Confirm the source branch is clean.
3. Run a dry-run.
4. Review the production diff.

`design-previews/` and `output/` are preserved local directories and are not deployed.

## Dry-run

From the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\deploy-local.ps1 -DryRun
```

The npm and one-click entrypoints are also available:

```powershell
npm run deploy:local -- --dry-run
deploy-local.bat -DryRun
```

Dry-run may run unit tests, rebuild `dist`, create a temporary isolated worktree from `origin/main`, synchronize the production tree, and show the changed-file preview. It never pushes `source` or `main`, never creates a persistent production commit, and prints:

```text
DRY RUN - NOTHING WAS PUSHED TO MAIN
```

## Real deployment

After explicit approval, run:

```powershell
npm run deploy:local
```

or:

```powershell
deploy-local.bat
```

The script verifies `source`, rejects tracked or unapproved untracked changes, fetches `origin/source` and `origin/main`, runs `npm run test:unit` and `npm run build`, uses an isolated temporary worktree based on the latest `origin/main`, mirrors the verified `dist` tree, and creates a traceable `Deploy source <short-sha>` commit only when production files changed.

The source worktree is never switched to `main`. No force-push is used. Remote divergence or a push failure stops the deployment and requires a fresh run.

## Legacy workflow

`.github/workflows/deploy.yml` remains available only through manual dispatch and no longer runs on `source` pushes. Use the local PowerShell path as the primary deployment mechanism. Do not run the legacy workflow and local deployment for the same release.
