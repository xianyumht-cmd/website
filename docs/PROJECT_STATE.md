# Project State

## Current development state

- Canonical development branch: `source`.
- Current task branch: `test/phase4-nav-release-hardening-20260915`.
- Phase 4 is stacked directly on the completed Phase 3 head `f117f9df1612015f906d79b0e59d1fcbea453523`.
- No Phase 1, Phase 2, Phase 3, or Phase 4 branch in this stack has been merged or deployed by this task.
- Production baseline still includes performance PR #3, squash-merged into `source` on 2026-08-09 as `996d26afc2d7a78925cd937bbe6dcdaf08389d13`.

## Active Phase 4 — NAV release hardening

Phase 4 hardens the redesigned NAV for release without changing the resource catalog or redesigning other pages.

Implemented on this branch:

- NAV now exposes useful search/social metadata: a descriptive page title, meta description, robots directive and Open Graph title/description/locale.
- Chinese/English switching keeps the document title, description, Open Graph text/locale and accessibility labels synchronized with the active language.
- A keyboard-visible skip link targets the main content.
- The search field has an explicit accessible name.
- The mobile theme control and the three floating utility actions use native buttons instead of click-only anchor/div controls.
- NAV-only `:focus-visible` treatment covers utility controls, search, sidebar links, cards and the skip link.
- Mobile theme/menu controls are locked to at least `40x40` CSS pixels.
- Playwright now exercises realistic keyboard and search workflows rather than only checking element presence: skip-link navigation, keyboard language switching, search/filter/clear focus behavior, mobile Enter/Escape drawer behavior, touch-target sizing and horizontal-overflow detection.
- The overflow assertion found a real 375px bug in `#notice`: its legacy width/box model extended from `left=15` to `right=388`, making a 375px viewport scroll to 388px. NAV mobile CSS now constrains the notice/search notice wrapper with border-box sizing and the test keeps element-level overflow diagnostics for future regressions.

Validated implementation head before documentation closeout: `eb0be2e2df1e3f653ae3151d64cc562305718263`.

Quality Gate run `34895092320` passed on that implementation head with:

- 0 npm vulnerabilities;
- clean HTML/CSS/JavaScript lint;
- 52/52 unit tests;
- 10/10 Playwright smoke/e2e tests;
- successful production build and `dist/_headers` security verification;
- NAV Lighthouse `0.98 / 0.98 / 0.98`, median `0.98`, max CLS `0.0264`;
- TDR Lighthouse `0.99 / 1.00 / 0.99`, median `0.99`, max CLS `0.0000`.

The Phase 4 implementation diff is NAV-scoped. It adds/changes only NAV accessibility/metadata code and its browser test; it does not change GroupGuard bot source, Games presentation, the NAV resource catalog, dependencies, workflows or deployment configuration.

## Completed Phase 3 — NAV human-directory redesign

Phase 3 intentionally changed only the NAV page presentation. Games remains on the shared resource-page shell and is protected by regression tests.

The design direction is a maintained resource directory rather than a generic AI/SaaS dashboard:

- search, categories and resource entries are the primary hierarchy;
- the old four-card visual status dashboard is retired;
- automatically generated card pills such as category/resource-entry/extraction-code labels are retired;
- version and feedback information remains available in a lightweight strip rather than competing with the directory;
- resource cards use a restrained directory/list-card treatment with no hover lift or dashboard-style decoration;
- the top area is a compact utility bar plus one plain page heading;
- Chinese/English switching, theme controls, search, sidebar navigation, version metadata and the existing resource catalog remain functional.

Phase 3 also fixed a first-paint mobile CLS regression exposed by the redesign. At widths `<= 820px`, CSS keeps the NAV category menu hidden during initial paint until the authoritative runtime sidebar state is applied.

Phase 3 final head: `f117f9df1612015f906d79b0e59d1fcbea453523`.

Final Phase 3 Quality Gate run `34887851851` passed with 52/52 unit tests, 7/7 Playwright tests, NAV Lighthouse median `0.98` with max CLS `0.0264`, and TDR median `0.99` with CLS `0`.

Temporary CLS-diagnostic changes were isolated to `tmp/phase3-nav-cls-diagnose-20260915` and are not part of the formal Phase 3 diff.

## Completed Phase 2 — quality, security and ownership cleanup

Phase 2 closed low-risk maintenance debt before intentional visual redesign:

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

After the latest Phase 4 documentation-closeout head passes the full Quality Gate, the stacked branch is ready for review. Do not merge to `source` or deploy without explicit authorization.
