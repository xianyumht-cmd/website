# Project State

## Current development state

- Canonical development branch: `source`.
- Performance optimization PR #3 `perf: speed up resource pages and add production audit` was squash-merged into `source` on 2026-08-09.
- Code merge commit: `996d26afc2d7a78925cd937bbe6dcdaf08389d13`.
- The performance work targets normal visitor speed for the homepage/resource pages, especially mobile and lower-performance browsers.

## Performance task status

Merged from PR #3:

- `/down/games/` no longer parser-blocks on the 51.la visitor widget; the widget is deferred until after page load/idle time.
- Navigation Baidu analytics and the 51.la visitor widget are no longer injected during the initial HTML critical path.
- 51.la SDK initialization now waits for the real SDK instead of permanently marking a dummy fallback as initialized.
- Navigation visual enhancement no longer runs fixed full-page rebuilds at 300 ms, 1 s, and 2.2 s.
- Spirit-card DOM observation is limited to direct resource-container changes instead of reacting to every descendant tag update.
- `nav` and `games` no longer load the duplicate `enhanced-translation` runtime; their existing complete zh/en datasets remain the source for resource translations.
- `npm run test:perf:prod` audits the real production homepage, navigation page, and games page with Lighthouse.

## Verification state

- Source-vs-branch diff was reviewed and unrelated changes were removed before merge.
- Cloudflare Pages successfully built and deployed the PR preview for head `4c799b4` before merge.
- PR #3 is merged into `source`.
- Production-domain verification remains the next step after Cloudflare finishes the `source` deployment; user-visible behavior and speed should be checked on `/`, `/down/nav/`, and `/down/games/`.
