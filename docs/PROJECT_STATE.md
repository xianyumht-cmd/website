# Project State

## Current development state

- Canonical development branch: `source`.
- Current task branch: `feat/phase3-nav-human-directory-20260915`.
- Phase 3 is stacked directly on the completed Phase 2 finalization head `a8e8b956f9be304816759ad1757bd41a7826a8bb`.
- No Phase 1, Phase 2, or Phase 3 branch in this stack has been merged or deployed by this task.
- Production baseline still includes performance PR #3, squash-merged into `source` on 2026-08-09 as `996d26afc2d7a78925cd937bbe6dcdaf08389d13`.

## Active Phase 3 — NAV human-directory redesign

Phase 3 intentionally changes only the NAV page presentation. Games remains on the shared resource-page shell and is protected by existing regression tests.

The design direction is a maintained resource directory rather than a generic AI/SaaS dashboard:

- search, categories and resource entries are the primary hierarchy;
- the old four-card visual status dashboard is retired;
- automatically generated card pills such as category/resource-entry/extraction-code labels are retired;
- version and feedback information remains available in a lightweight strip rather than competing with the directory;
- resource cards use a restrained directory/list-card treatment with no hover lift or dashboard-style decoration;
- the top area is a compact utility bar plus one plain page heading;
- Chinese/English switching, theme controls, search, sidebar navigation, version metadata and the existing resource catalog remain functional.

Phase 3 also fixes a first-paint mobile CLS regression exposed by the redesign. At widths `<= 820px`, CSS now keeps the NAV category menu hidden during the initial paint and `resource-sidebar.js` releases that temporary guard only after it has applied the real `resource-sidebar-closed` state. This prevents the main content from first rendering below an expanded menu and then jumping upward.

Validated implementation head before documentation closeout: `812e28c104d71e4d1cee7274905615c6bf007c45`.

Quality Gate run `34886369318` passed on that implementation head with:

- 0 npm vulnerabilities;
- clean HTML/CSS/JavaScript lint;
- 52/52 unit tests;
- 7/7 Playwright smoke/e2e tests;
- successful production build and `dist/_headers` security verification;
- NAV Lighthouse `0.98 / 0.98 / 0.98`, median `0.98`, max CLS `0.0264`;
- TDR Lighthouse `0.99 / 0.99 / 0.99`, max CLS `0.0000`.

The Phase 3 comparison against the Phase 2 finalization head contains only six implementation/test files:

1. `src/assets/css/nav-visual-enhance.css`
2. `src/assets/js/nav-i18n.js`
3. `src/pages/nav/index.html`
4. `src/pages/nav/nav-visual.js`
5. `tests/down.spec.ts`
6. `tests/e2e/nav-version-lifecycle.spec.ts`

Temporary CLS-diagnostic changes were isolated to `tmp/phase3-nav-cls-diagnose-20260915` and are not part of the formal Phase 3 diff.

## Completed Phase 2 — quality, security and ownership cleanup

Phase 2 closed the low-risk maintenance debt before intentional visual redesign:

- GroupGuard's static `public/groupguard/manual.html` now passes the normal repository-wide HTML validation baseline. This is only a static manual shipped from the website repository; no GroupGuard bot/source repository was modified.
- `DEVELOPER_GUIDE.md` and `SECURITY.md` reflect the current Vite + Cloudflare Pages architecture rather than retired Rust/WASM, frontend encryption/obfuscation, key-splitting or anti-debug designs.
- `public/_headers` defines the repository-managed Cloudflare Pages security baseline and the production build verifies that `dist/_headers` contains it.
- resource sidebar runtime state is owned by `.page-container.resource-sidebar-closed`; obsolete horizontal mobile-menu ownership was removed where browser/performance evidence proved it safe.
- dependency remediation removed the vulnerable unused LHCI chain and the repository remains at 0 npm vulnerabilities.
- GroupGuard's former 27 HTML warnings were repaired in markup rather than hidden behind a local warning downgrade.

Phase 2 finalization head: `a8e8b956f9be304816759ad1757bd41a7826a8bb`.

## Phase 1 stacked predecessors

The current stack builds on these unmerged review branches:

- PR #7 / `chore/phase1-quality-gates-20260914`: blocking JS/HTML/CSS lint, unit, smoke and build gates; tracked test artifacts removed.
- PR #8 / `fix/dependency-audit-20260914`: removed the vulnerable unused LHCI dependency chain, upgraded Lighthouse to 13.4.1, declared `chrome-launcher` directly, and reached 0 npm vulnerabilities.
- PR #9 / `perf/phase1-6-nav-lighthouse-20260914`: fixed the original mobile NAV drawer CLS source and made Lighthouse a repeated 3-run gate using median performance `>= 0.90` plus hard max CLS `<= 0.10`.

None of these PRs are treated as merged merely because later task branches are stacked on them.

## Current quality contract

Task/PR Quality Gate runs:

1. clean dependency install;
2. `npm audit --audit-level=high`;
3. HTML, CSS and authored JavaScript lint;
4. Jest unit tests;
5. Playwright Chromium smoke/e2e tests;
6. production build, including final `dist/_headers` security verification;
7. repeated NAV/TDR Lighthouse thresholds.

Required checks are blocking. Do not lower performance/CLS thresholds or use `continue-on-error` to make a branch green.

## Known remaining debt

- ESLint 8.57.1 is deprecated. Upgrade to ESLint 10 in a dedicated dependency migration with flat config and a genuine npm lockfile refresh.
- Resource pages still import some legacy CSS layers. Their remaining declarations must be retired through controlled ownership/refactor work with browser and Lighthouse proof, not by selector-search alone.
- A stricter CSP covering scripts/styles is deferred until inline and third-party resources are inventoried and migrated without breaking production behavior.
- TDR legacy scripts under `src/pages/tdr/static/script/**` remain the only explicit authored-JavaScript lint exclusion.

## Next step

After the latest Phase 3 documentation-closeout head passes the full Quality Gate, the branch is ready for review. Do not merge to `source` or deploy without explicit authorization.
