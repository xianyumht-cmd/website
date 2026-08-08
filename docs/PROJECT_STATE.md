# Project State

## Current development state

- Canonical development branch: `source`.
- Active performance task branch: `perf/user-path-20260809`.
- Active pull request: #3 `perf: speed up resource pages and add production audit`.
- The task is focused on normal visitor speed for the homepage/resource pages, especially mobile and lower-performance browsers.

## Performance task status

Implemented on PR #3:

- `/down/games/` no longer parser-blocks on the 51.la visitor widget; the widget is deferred until after page load/idle time.
- Navigation Baidu analytics and the 51.la visitor widget are no longer injected during the initial HTML critical path.
- 51.la SDK initialization now waits for the real SDK instead of permanently marking a dummy fallback as initialized.
- Navigation visual enhancement no longer runs fixed full-page rebuilds at 300 ms, 1 s, and 2.2 s.
- Spirit-card DOM observation is limited to direct resource-container changes instead of reacting to every descendant tag update.
- `nav` and `games` no longer load the duplicate `enhanced-translation` runtime; their existing complete zh/en datasets remain the source for resource translations.
- `npm run test:perf:prod` audits the real production homepage, navigation page, and games page with Lighthouse.

## Verification state

- Source-vs-branch diff was reviewed to remove unrelated changes.
- No GitHub Actions workflow run is currently available for the PR head, so build/lint/browser execution has not been verified by remote CI in this task yet.
- PR #3 is not merged and these changes are not deployed to production.
