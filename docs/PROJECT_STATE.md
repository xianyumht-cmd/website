# Project State

## Production status

- Canonical development branch: `source`.
- Phase 1–4 integration PR #10, `release: finalize website hardening and NAV redesign`, was squash-merged to `source` on 2026-09-15.
- Released source commit: `fc00ad5924fc6ba2213769a51edda6b7fd7c8244`.
- Production artifact branch `main` was published from that source commit as `28af653ccc3ea3e2d6674e8aa46598e117379b9a`.
- Production deployment workflow run `34898994403` completed successfully.
- Earlier stacked draft PRs #7, #8 and #9 were superseded by PR #10 and are closed without separate merges.
- PR #4 (`fix: restore native links and align resource breakpoint`) remains a separate, older unmerged follow-up. It is not part of the Phase 1–4 release and must be reviewed/rebased independently before any future merge.

## Released Phase 1–4 scope

The completed release includes:

- blocking dependency audit, HTML/CSS/authored-JavaScript lint, Jest, Playwright, production build and Lighthouse quality gates;
- dependency remediation from the previous vulnerable baseline to 0 known npm audit vulnerabilities;
- repeated NAV/TDR Lighthouse checks using median performance `>= 0.90` and hard max CLS `<= 0.10`;
- Cloudflare Pages response-security headers plus build verification that `dist/_headers` contains the required baseline;
- current `SECURITY.md` and `DEVELOPER_GUIDE.md` aligned with the actual Vite/static-site architecture;
- GroupGuard static manual HTML conformance fixes only; no GroupGuard bot/source repository was modified;
- resource-sidebar/CSS ownership cleanup backed by browser regressions;
- NAV redesign from a dashboard/AI-template presentation to a restrained human-maintained resource directory;
- mobile first-paint drawer/CLS stabilization;
- NAV SEO metadata, native keyboard controls, skip link, accessible search naming, touch-target sizing and mobile overflow protection;
- a regression for the 375px `#notice` horizontal-overflow bug.

## Final production validation

Deployment run `34898994403` validated the exact merged `source` commit before publishing `main`:

- `npm audit --audit-level=high`: 0 vulnerabilities;
- HTML/CSS/JavaScript lint: PASS;
- Jest: 52/52 tests PASS;
- Playwright smoke/e2e: 10/10 tests PASS;
- Vite production build: PASS;
- `dist/_headers` security verification: PASS;
- NAV Lighthouse: `0.98 / 0.98 / 0.98`, median `0.98`, max CLS `0.0264`;
- TDR Lighthouse: `0.99 / 0.99 / 1.00`, median `0.99`, max CLS `0.0000`;
- publish to `main`: PASS.

## Current quality contract

Task/PR and production validation must continue to block on:

1. clean dependency install;
2. `npm audit --audit-level=high`;
3. HTML, CSS and authored JavaScript lint;
4. Jest unit tests;
5. Playwright Chromium smoke/e2e tests;
6. production build, including final `dist/_headers` verification;
7. repeated NAV/TDR Lighthouse thresholds.

Do not lower performance/CLS thresholds or add `continue-on-error` merely to make a change green.

## Known remaining debt

- ESLint 8.57.1 is deprecated. Upgrade to ESLint 10 in a dedicated toolchain migration with flat config and a real npm lockfile refresh.
- Resource pages still include legacy CSS layers. Remaining cleanup must use browser and Lighthouse proof rather than selector-search alone.
- A stricter CSP covering scripts/styles is deferred until inline and third-party resources can be inventoried and migrated without breaking production behavior.
- TDR legacy scripts under `src/pages/tdr/static/script/**` remain the only explicit authored-JavaScript lint exclusion.
- npm reports install-script policy warnings for `esbuild@0.27.2` and `unrs-resolver@1.11.1`; these are not audit vulnerabilities and remain a separate supply-chain policy decision.

## Release closeout

Phase 1–4 is merged, validated and deployed. Treat `fc00ad5924fc6ba2213769a51edda6b7fd7c8244` as the released source baseline and `28af653ccc3ea3e2d6674e8aa46598e117379b9a` as its generated production artifact commit.

Future work should start from current `source` on a new task branch. Do not fold PR #4 or other historical branches into the released baseline without a fresh review and full Quality Gate.

## NAV sidebar follow-up closeout

- PR #12, `fix: restore NAV category navigation and refine sidebar`, was squash-merged to `source` on 2026-09-22.
- Merged source commit: `8ecf4cfafe0d2be3277d8e61c2204cc8561aa155`.
- PR Quality Gate run `35640610807` passed dependency audit, lint, unit tests, Playwright smoke/e2e, production build, and repeated Lighthouse performance thresholds.
- The category fragment target now belongs to the visible `.resource-section`, not the hidden heading icon.
- NAV tracks the current category with `aria-current="location"` and an active sidebar state while scrolling or navigating by hash.
- The NAV-only sidebar now uses the refined compact directory treatment and mobile width containment; Games remains unchanged.
- Regression coverage verifies real category navigation, localized hash IDs, current-location state, and existing 375px overflow protection.
- Production `main` has not been published from this merge yet.

