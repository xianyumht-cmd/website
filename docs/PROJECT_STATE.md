# Project State

## Current development state

- Canonical development branch: `source`.
- Performance optimization PR #3 `perf: speed up resource pages and add production audit` was squash-merged into `source` on 2026-08-09.
- PR #3 code merge commit: `996d26afc2d7a78925cd937bbe6dcdaf08389d13`.
- Post-merge state documentation commit: `ec4ac7a52f1581e08e4968f49a328adb6bc4569b`.
- The user performed an initial production check after PR #3 and reported no visible problems; treat that `source` state as the current rollback baseline.
- Active follow-up branch: `fix/native-links-breakpoint-20260809`.
- Active pull request: #4 `fix: restore native links and align resource breakpoint`.

## PR #3 accepted performance baseline

Merged from PR #3:

- `/down/games/` no longer parser-blocks on the 51.la visitor widget; the widget is deferred until after page load/idle time.
- Navigation Baidu analytics and the 51.la visitor widget are no longer injected during the initial HTML critical path.
- 51.la SDK initialization now waits for the real SDK instead of permanently marking a dummy fallback as initialized.
- Navigation visual enhancement no longer runs fixed full-page rebuilds at 300 ms, 1 s, and 2.2 s.
- Spirit-card DOM observation is limited to direct resource-container changes instead of reacting to every descendant tag update.
- `nav` and `games` no longer load the duplicate `enhanced-translation` runtime; their existing complete zh/en datasets remain the source for resource translations.
- `npm run test:perf:prod` audits the real production homepage, navigation page, and games page with Lighthouse.

## Active PR #4

PR #4 addresses two follow-up reliability issues without intentionally changing the visual design:

- Homepage business entries remain synchronized from `site-config.json`, but JavaScript no longer prevents the native `<a>` navigation and replaces it with `window.open()`.
- A shared final CSS layer makes the resource-page shell use the same 820px breakpoint as the category drawer, closing the previous 769–820px mixed desktop/mobile range on both nav and games.
- Playwright coverage was added for native homepage-link behavior and for the nav/games shell at 810px.

## Verification state

- PR #4 was created from `source` commit `ec4ac7a52f1581e08e4968f49a328adb6bc4569b` and was not behind `source` when opened.
- The source-vs-branch file list contains only the intended homepage-link, resource-breakpoint, test, and project-state changes.
- The new Playwright tests exist in the branch, but no GitHub CI result has verified their execution yet.
- PR #4 is not merged into `source` and is not a production release.
- Use the Cloudflare PR preview, when available, to check desktop, normal mobile, and approximately 810px layouts before deciding whether to merge.
