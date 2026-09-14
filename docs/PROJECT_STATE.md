# Project State

## Current development state

- Canonical development branch: `source`.
- Performance optimization PR #3 `perf: speed up resource pages and add production audit` was squash-merged into `source` on 2026-08-09.
- Code merge commit: `996d26afc2d7a78925cd937bbe6dcdaf08389d13`.
- The performance work targets normal visitor speed for the homepage/resource pages, especially mobile and lower-performance browsers.

## Active dependency remediation

- Active task branch: `fix/dependency-audit-20260914`, stacked on the Phase 1 quality-gate head.
- Baseline under Node 24/npm 11 was 56 npm advisories: 4 low, 24 moderate, 27 high, and 1 critical.
- The critical path was transitive: unused `@lhci/cli@0.15.1` -> `proxy-agent` -> `pac-proxy-agent` -> `get-uri` -> vulnerable `basic-ftp@5.1.0`.
- Repository performance scripts do not use LHCI; they import `lighthouse` directly, so `@lhci/cli` has been removed.
- `lighthouse` is raised from `^13.0.1` to `^13.4.1`; the lockfile was refreshed with non-breaking npm operations rather than `npm audit fix --force`.
- The validated remediation simulation reached `npm audit`: 0 vulnerabilities. The permanent quality, automatic deployment, and local deployment paths now block on `npm audit --audit-level=high`.
- Final branch validation must still prove a clean install, dependency audit, lint, unit tests, Playwright smoke tests, production build, and Lighthouse compatibility before this task is ready for review.

## Active quality-gate hardening

- Active task branch: `chore/phase1-quality-gates-20260914`.
- Draft PR: #7 `ci: establish phase-one quality gates`.
- The task adds JavaScript ESLint coverage for authored project code, keeps legacy TDR game scripts as an explicit narrow exclusion, and makes production lint/unit/smoke failures blocking.
- Pull requests and non-production task branches run the same Quality Gate before merge: dependency audit, lint, unit tests, Playwright Chromium smoke tests, then a production build.
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
