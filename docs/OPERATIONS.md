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

## One-Click Maintenance

The Windows 10 primary entrypoint is `onekeyup.cmd` at the repository root. It invokes `scripts\onekeyup.ps1` through Windows PowerShell 5.1 and reuses the existing updater and local deployment commands. It does not add scheduling, GitHub Actions publication, or another version source.

Normal mode:

```text
onekeyup.cmd
```

Dry-run mode:

```text
onekeyup.cmd --dry-run
```

Automation-friendly no-pause mode:

```text
onekeyup.cmd --no-pause
```

Dry-run without the final console pause:

```text
onekeyup.cmd --dry-run --no-pause
```

Normal mode requires the `source` branch, a clean tracked source tree, and local `HEAD` equal to `origin/source`. It runs the updater dry-run first, then the real updater, and accepts only `src/assets/data/lol-version.json` as the maintenance change. It validates the new JSON, runs unit tests, builds, runs the NAV lifecycle Playwright test, checks the diff, commits the actual version, performs a second remote check, pushes `source` normally, runs the deployment dry-run, and finally reuses `npm run deploy:local` for production publication.

The command exits `0` for a successful dry-run, an already-current version, or a completed maintenance cycle. It exits nonzero for blocked or failed stages. It never stages `design-previews/` or `output/`, never uses `git clean`, never resets source automatically, never force-pushes, and never disables TLS verification. If source is pushed but main deployment fails, it reports the partial state and does not roll source backward.

The lower-level manual commands documented above remain the recovery path when a maintainer needs to inspect or operate each stage separately.

## LOL NAV Version Maintenance

`src/assets/data/lol-version.json` is the only canonical NAV LOL version file. Riot's official patch notes are the preferred source; the legacy cc1990 provider is an optional fallback only and requires `LOL_API_KEY` from the environment. No scheduled updater, cron job, Windows Task Scheduler job, build-time network update, or GitHub scheduled updater is used.

### Normal version update workflow

Run these steps from the repository root:

1. Inspect the live candidate without writing:

   ```text
   npm run update:lol-version -- --dry-run
   ```

2. If the Riot candidate is valid and newer, update the canonical file through the updater:

   ```text
   npm run update:lol-version
   ```

3. Review the canonical change:

   ```text
   git diff -- src/assets/data/lol-version.json
   ```

4. Run validation:

   ```text
   npm run test:unit
   npm run build
   npx playwright test tests/e2e/nav-version-lifecycle.spec.ts
   ```

5. Stage only explicitly reviewed paths and commit the source change:

   ```text
   git add -- <explicit reviewed paths>
   git commit -m "<appropriate message>"
   ```

6. Push `source` normally after a fresh check:

   ```text
   git fetch origin source main
   git push origin source
   ```

7. Preview production publication:

   ```text
   npm run deploy:local -- --dry-run
   ```

8. Publish through the primary local Plan B path:

   ```text
   npm run deploy:local
   ```

9. Verify `origin/source`, `origin/main`, `https://xn--8pv109c.top`, and the deployed NAV version data.

### Failure and recovery

- If Riot is unavailable or ambiguous, leave the canonical file unchanged; do not guess patch data.
- If cc1990 is unavailable, the Riot path remains valid. The fallback is optional.
- A missing `LOL_API_KEY` must not block a successful Riot operation.
- If the official schedule is unavailable, `fallback:+14 days` is only an approximation and must remain visible in updater diagnostics.
- On Git TLS failure, retry the secure operation later. Never disable certificate verification.
- If `origin/source` changes, reconcile first. Do not rebase and publish automatically, and never force-push.
- If deployment dry-run fails, do not publish `main`.
- If `main` changes unexpectedly, run a new fresh dry-run; never force-push.
- For CDN propagation delay, verify Git `main` first and do not repeatedly redeploy.

### Canonical data ownership

Only `src/assets/data/lol-version.json` owns the NAV version, update date, and next update date. `src/assets/data/nav-data.json`, `src/pages/nav/nav-patches.js`, `src/pages/nav/nav-confirmed-fixes.js`, Games-page data, and frontend fallbacks are not authoritative and must not introduce another NAV version source. The normal build imports the canonical JSON locally and does not contact Riot or cc1990.

### Deployment and security policy

`npm run deploy:local` is the primary deployment path. It builds from `source`, fetches a fresh `origin/main`, uses a temporary production worktree, and pushes a traceable `Deploy source <short-sha>` commit. Never deploy from local `main` and never run `git push --force origin main`.

`.github/workflows/deploy.yml` remains manual-only and is not required for publication. `deploy_to_github.ps1` remains only as a compatibility wrapper around the local deployment script. No embedded API credential, committed `.env`, TLS bypass, or secret logging is permitted. Historical Git credential exposure is out of scope for this workflow and must not be rewritten here.
