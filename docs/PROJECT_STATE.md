# Project State

## Current development state

- Canonical development branch: `source`.
- Current task branch: `chore/phase2-finalize-quality-docs-20260915`.
- Current task is stacked on Phase 2.2 head `43249454ead60df5489d30f81b1ae1767b983d30`.
- No Phase 2 branch in this stack has been merged or deployed by this task.
- Production baseline still includes performance PR #3, squash-merged into `source` on 2026-08-09 as `996d26afc2d7a78925cd937bbe6dcdaf08389d13`.

## Active Phase 2 finalization

This branch closes the remaining low-risk Phase 2 maintenance debt before the NAV visual redesign phase.

Completed on the branch so far:

- `public/groupguard/manual.html` now gives all buttons explicit `type="button"` and its search input explicit `type="search"`.
- The temporary `public/groupguard/.htmlvalidate.json` warning downgrade has been removed, so GroupGuard uses the normal repository-wide HTML validation baseline.
- `DEVELOPER_GUIDE.md` has been rewritten against the current repository structure. It no longer documents retired Rust/WASM, frontend encryption/obfuscation, old `down/nav/nav-data.min.js`, or the old build layout as current architecture.
- ESLint 10 migration feasibility has been reviewed. The repository's Node versions are sufficient, but ESLint 10 removes `.eslintrc.*` and requires a real flat-config/dependency/lockfile migration. ESLint remains pinned at 8.57.1 until that dedicated dependency migration can refresh the lockfile through npm and run the full gate.
- `docs/DECISIONS.md` records the GroupGuard validation policy and ESLint migration boundary.

This branch still requires a final full Quality Gate before it is considered ready for review.

## Phase 2.2 predecessor — CSS/security hardening

Branch: `chore/phase2-2-css-security-20260915`

Head: `43249454ead60df5489d30f81b1ae1767b983d30`

Validated results:

- `resource-pages.css` remains the final NAV/Games resource-page visual owner.
- Playwright locks the desktop Swiss sidebar/menu computed styles and the shared mobile vertical drawer behavior.
- `SECURITY.md` now reflects the real static Vite + Cloudflare Pages threat model rather than the retired AES/key-splitting/steganography/anti-debug design.
- `public/_headers` defines the repository-managed Cloudflare Pages security baseline.
- `scripts/verify-dist-security.mjs` blocks builds where `dist/_headers` is missing or loses required headers.
- Quality Gate run `34874167782` passed at the Phase 2.2 head.
- That run reported 0 npm vulnerabilities, 52/52 unit tests, 6/6 Playwright smoke tests, a successful production build, NAV Lighthouse median `0.96` with max CLS `0.0920`, and TDR Lighthouse median `0.99` with CLS `0`.

## Phase 2.1 predecessor — resource sidebar CSS ownership

Phase 2.1 removed only CSS rules proven safe to retire and kept compatibility rules that still affect first-paint geometry.

Key results:

- The obsolete `<=768px` horizontal resource-menu implementation was removed from `resource-pages.css`.
- NAV and Games tests lock the current vertical mobile drawer behavior.
- Runtime sidebar state is owned by `.page-container.resource-sidebar-closed`; `.sidebar-menu.collapsed` is not used as the current control state.
- An attempted deeper `mobile.min.css` cleanup was reverted after Lighthouse exposed a real CLS regression, establishing the rule that apparently unused legacy CSS cannot be removed without browser/performance proof.
- Phase 2.1D head `be87005d69dc5d65ce59ee8185022904b2dc15a8` passed Quality Gate run `34871275321` with NAV median `0.96`, max CLS `0.0920`, and TDR median `0.99`.

## Phase 1 stacked predecessors

The current stack builds on these unmerged review branches:

- PR #7 / `chore/phase1-quality-gates-20260914`: blocking JS/HTML/CSS lint, unit, smoke and build gates; tracked test artifacts removed.
- PR #8 / `fix/dependency-audit-20260914`: removed the vulnerable unused LHCI dependency chain, upgraded Lighthouse to 13.4.1, declared `chrome-launcher` directly, and reached 0 npm vulnerabilities.
- PR #9 / `perf/phase1-6-nav-lighthouse-20260914`: fixed the mobile NAV drawer CLS source and made Lighthouse a repeated 3-run gate using median performance `>= 0.90` plus hard max CLS `<= 0.10`.

PR #9 was verified mergeable and its stacked CI state was green. None of these PRs are treated as merged merely because later task branches are stacked on them.

## Current quality contract

Task/PR Quality Gate runs:

1. clean dependency install;
2. `npm audit --audit-level=high`;
3. HTML, CSS and authored JavaScript lint;
4. Jest unit tests;
5. Playwright Chromium smoke tests;
6. production build, including final `dist/_headers` security verification;
7. repeated NAV/TDR Lighthouse thresholds.

Required checks are blocking. Do not lower performance/CLS thresholds or use `continue-on-error` to make a branch green.

## Known remaining debt after Phase 2

- ESLint 8.57.1 is deprecated. Upgrade to ESLint 10 in a dedicated dependency migration with flat config and a genuine npm lockfile refresh.
- Resource pages still import some legacy CSS layers. Their remaining declarations must be retired during a controlled visual ownership/refactor task, not by selector-search alone.
- A stricter CSP covering scripts/styles is deferred until inline and third-party resources are inventoried and migrated without breaking production behavior.
- TDR legacy scripts under `src/pages/tdr/static/script/**` remain the only explicit authored-JavaScript lint exclusion.

## Next planned phase

After this Phase 2 finalization branch is fully green and reviewed, the next major work item is Phase 3: NAV de-AI visual redesign. That phase should change appearance intentionally rather than mixing visual redesign into maintenance cleanup.
