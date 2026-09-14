# Project State

## Current development state

- Canonical development branch: `source`.
- Performance optimization PR #3 `perf: speed up resource pages and add production audit` was squash-merged into `source` on 2026-08-09.
- Code merge commit: `996d26afc2d7a78925cd937bbe6dcdaf08389d13`.
- The performance work targets normal visitor speed for the homepage/resource pages, especially mobile and lower-performance browsers.

## Active NAV Lighthouse stabilization

- Active task branch: `perf/phase1-6-nav-lighthouse-20260914`, stacked on the dependency-remediation head.
- The old single-run NAV Lighthouse failure was traced to cumulative layout shift rather than CPU or network cost. Failing runs had performance score about `0.80-0.81` with CLS `0.3697888138556004`, while FCP/LCP remained fast and TBT was only about 30-40 ms.
- The exact mobile shift source was `.main-content`. During NAV category population, the shared category drawer grew from the initial mobile shell and moved main content from `y=155` to about `y=528.95`.
- `resource-pages.css` intentionally defines the final `<= 820px` category UI as a vertical drawer. `resource-sidebar.js` had been initializing that drawer open on every viewport, so dynamically adding 19 NAV categories after first paint expanded it to roughly 529 px and pushed the entire page down.
- Desktop behavior remains unchanged: the category sidebar starts open. Mobile/tablet widths `<= 820px` now start with the category drawer collapsed and can open it through the existing toggle. Playwright smoke coverage verifies the desktop open/collapse flow and the mobile collapsed/open/close flow.
- Repeated post-fix validation on Ubuntu 24.04 measured NAV scores `0.97, 0.97, 0.97, 0.97, 0.97` with maximum CLS `0.08106547925749524`. TDR measured `0.99, 0.99, 0.99` with CLS `0`.
- The existing one-run `npm run test:perf` also passed after the fix at NAV `0.97` and TDR `0.99`.
- The permanent `npm run test:perf` contract now runs NAV and TDR three times each, requires median performance score `>= 0.90`, and fails if maximum CLS across the three runs exceeds `0.10`. It does not use best-of-N and the score threshold was not lowered.
- Task/PR Quality Gate and automatic `source` deployment run the repeated Lighthouse gate after the production build. The local PowerShell deploy path keeps its existing dependency/unit/build checks so local deployment does not require a browser installation solely for Lighthouse.
- Formal branch Quality Gate run `34850950877` passed dependency audit, lint, 50 unit tests, updated Playwright smoke coverage, and production build at commit `016a226f88cb59b631cec1d72709591b9776d02f`. A final Quality Gate including the new repeated performance step is required at the branch head before review.
- This task is not merged or deployed.

## Active dependency remediation

- Active task branch: `fix/dependency-audit-20260914`, stacked on the Phase 1 quality-gate head.
- Draft PR: #8 `deps: remove vulnerable dependency chain`.
- Baseline under Node 24/npm 11 was 56 npm advisories: 4 low, 24 moderate, 27 high, and 1 critical.
- The critical path was transitive: unused `@lhci/cli@0.15.1` -> `proxy-agent` -> `pac-proxy-agent` -> `get-uri` -> vulnerable `basic-ftp@5.1.0`.
- Repository performance scripts do not use LHCI; they import `lighthouse` directly, so `@lhci/cli` has been removed.
- `lighthouse` is raised from `^13.0.1` to `^13.4.1`; `chrome-launcher@^1.2.1` is now declared directly because the performance runner imports it directly. The lockfile was refreshed with non-breaking npm operations rather than `npm audit fix --force`.
- A clean Node 24/npm 11 install on the remediation branch reports `0 vulnerabilities`. The permanent quality, automatic deployment, and local deployment paths block on `npm audit --audit-level=high`.
- Final branch Quality Gate run `34849291458` passed clean install, dependency audit, lint, 50 unit tests, Playwright Chromium smoke tests, and production build at commit `18bd6321f2a537d6732693eaedba3161192fa359`.
- Lighthouse 13.4.1 and `chrome-launcher` execute end-to-end under Node 24. Linux CI adds `--no-sandbox` and `--disable-dev-shm-usage` because GitHub-hosted Ubuntu 24.04/AppArmor blocks the Chromium user-namespace sandbox; Windows local behavior is unchanged.
- A direct Phase 1 baseline comparison from commit `a3caa2f882835e5991c08527e11941b5ada61a93` measured NAV at 0.76 on the same class of GitHub-hosted runner. That comparison established that the old low single-run score was not caused by dependency remediation; Phase 1.6 subsequently isolated and fixed the mobile CLS source.
- This dependency task is not merged or deployed. Its Draft PR remains stacked on Phase 1.

## Active quality-gate hardening

- Active task branch: `chore/phase1-quality-gates-20260914`.
- Draft PR: #7 `ci: establish phase-one quality gates`.
- The task adds JavaScript ESLint coverage for authored project code, keeps legacy TDR game scripts as an explicit narrow exclusion, and makes production lint/unit/smoke failures blocking.
- Pull requests and non-production task branches run the shared Quality Gate before merge. Later stacked phases add dependency audit and repeated Lighthouse performance checks to that pipeline.
- CI uses Node 24; `package.json` requires Node `>=22.19` to match the Lighthouse 13 engine requirement.
- Recommended HTML link-text accessibility checks are enforced again; existing implicit button/input type debt in `public/groupguard/manual.html` remains visible as warnings instead of being globally disabled.
- `test-results/`, `playwright-report/`, coverage output, and ESLint cache are ignored; the previously tracked `test-results/.last-run.json` is removed on the task branch.
- This task is not merged or deployed yet. Final PR checks must remain green before it is considered ready to merge.

## Active NAV catalog cleanup

- Active task branch: `fix/nav-catalog-single-source-20260910`.
- NAV resource membership and links have been consolidated into `src/assets/data/nav-catalog.js` on the task branch.
- Legacy parallel resource sources (`nav-data.json`, `nav-patches.js`, daily/weekly/HE/Delta patch files) have been retired on the task branch.
- Chinese and English catalogs are now loaded from the same canonical file; existing intentional locale-specific resource differences are preserved instead of being changed by import order.
- The updated daily-card catalog includes Space, MD, LSC, KDA, acme, 如意/Ruyi, yun, DC, FE, SPOT, and SF; retired FY, HP, 骑士/Knight, and 蓝鲸/Blue Whale entries are not in that catalog.
- This task is not merged or deployed yet. Review/build/browser verification is still required before merge.

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

- Source-vs-branch diff for PR #3 was reviewed and unrelated changes were removed before merge.
- Cloudflare Pages successfully built and deployed the PR #3 preview for head `4c799b4` before merge.
- PR #3 is merged into `source`.
- Production-domain verification of `/`, `/down/nav/`, and `/down/games/` remains part of normal release validation.
