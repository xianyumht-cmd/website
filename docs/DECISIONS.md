# Decisions

## 2026-09-15 — NAV release hardening uses native controls and real interaction tests

Release-readiness checks for NAV must exercise real user interaction rather than treating a rendered page as sufficient. Phase 4 therefore keeps the Phase 3 visual design intact while strengthening semantics, keyboard behavior, mobile touch sizing, metadata and end-to-end coverage.

Click-only anchors/divs are not acceptable for primary utility actions when a native control fits the behavior. The mobile theme action and the floating top/theme/language actions use native buttons, and NAV provides visible `:focus-visible` treatment plus a skip link to the main content. Search and utility controls carry explicit accessible names that stay synchronized when the user switches between Chinese and English.

NAV metadata should describe the directory rather than use a generic page title. The document title, description and Open Graph title/description/locale are initialized in HTML and kept synchronized with the active NAV language. The resource catalog remains separate from this metadata work.

Mobile release tests must fail on horizontal document overflow instead of hiding it with a global overflow rule. The Phase 4 375px test found `#notice` extending from `left=15` to `right=388`, making a 375px viewport scroll to 388px. The fix is local box-model containment on the NAV search notice; the test permanently reports offending element rectangles when overflow returns. Do not weaken this assertion or mask future overflow with body-level clipping.

The validated Phase 4 implementation head `eb0be2e2df1e3f653ae3151d64cc562305718263` passed Quality Gate run `34895092320`: 0 npm vulnerabilities, 52/52 unit tests, 10/10 Playwright tests, successful production build/security-header verification, NAV Lighthouse `0.98 / 0.98 / 0.98` with max CLS `0.0264`, and TDR median `0.99` with CLS `0`.

## 2026-09-15 — NAV is a maintained resource directory, not a dashboard

The NAV page should present search, categories and resource entries as its primary hierarchy. It should not imitate a generic AI/SaaS dashboard merely to make the page look feature-rich.

Phase 3 therefore retires the four-card visual status dashboard and automatically generated card pills such as category/resource-entry/extraction-code labels. Version and feedback data remains available in a lightweight strip, while the main content uses restrained directory cards, one plain page heading, a compact utility bar and no hover-lift dashboard treatment.

The redesign is NAV-specific. Games continues to use the shared resource-page shell and must not inherit NAV-only visual changes. Existing functional behavior remains in scope: Chinese/English switching, theme controls, search, category navigation, resource catalog data, version information and sidebar controls.

Browser tests lock the intended outcome rather than a screenshot-only implementation detail: the retired dashboard/tag artifacts must stay absent, the directory grid and flat card behavior must remain, NAV version/language lifecycle must continue working, and Games sidebar behavior must remain unaffected.

The redesign exposed a mobile first-paint CLS source. At widths `<= 820px`, shared CSS would initially render the category menu as `display:block`; JavaScript then applied `resource-sidebar-closed`, moving the whole `.main-content` upward. Lighthouse attributed about `0.09366` CLS to `.main-content` and another `0.01962` to the first resource card, producing a repeatable total of `0.113287806`.

Do not lower the `0.10` CLS gate to accommodate this. NAV now carries a first-paint mobile drawer guard in the static page/CSS path, and `resource-sidebar.js` removes that temporary guard only after it has applied the authoritative runtime state. The validated result is NAV performance `0.98 / 0.98 / 0.98` with max CLS `0.0264` on Quality Gate run `34886369318`.

Temporary diagnostic instrumentation belongs only on temporary diagnostic branches. The formal Phase 3 comparison against the Phase 2 finalization head must not include Lighthouse diagnostic changes.

## 2026-09-15 — ESLint 10 upgrade requires a dedicated dependency migration

The repository still runs ESLint `8.57.1`. ESLint 10 is current and removes the legacy `.eslintrc.*` configuration system entirely, so the upgrade is not a safe one-line version bump.

The project already satisfies ESLint 10's Node requirement because CI uses Node 24 and `package.json` requires Node `>=22.19`. The remaining migration work is configuration and dependency-tree work: move to flat config, declare the flat-config support packages directly, refresh `package-lock.json` through npm rather than by hand, then fix or explicitly review any new `eslint:recommended` findings.

Do not hand-edit the ESLint 10 dependency tree merely to suppress npm's deprecation warning. Keep ESLint 8.57.1 pinned until a dedicated dependency task can perform a real lockfile refresh and run the full Quality Gate. The current JavaScript lint gate remains blocking in the meantime.

## 2026-09-15 — GroupGuard HTML uses the normal global validation baseline

`public/groupguard/manual.html` now gives every button an explicit `type="button"` and the search field an explicit `type="search"`. The local `public/groupguard/.htmlvalidate.json` warning downgrade is removed.

GroupGuard therefore inherits the repository-wide HTML validation rules like every other page. Accessibility/HTML debt should be fixed in source when the change is mechanical and low risk; narrow warning baselines are only for debt that cannot safely be repaired in the same task.

## 2026-09-15 — Resource-page visual ownership and static security baseline

`resource-pages.css` is the final visual/layout owner for the NAV and Games resource-page shell. Legacy imported styles may remain temporarily for compatibility, but current runtime state must use `.page-container.resource-sidebar-closed`; `.sidebar-menu.collapsed` is not a current control state. Playwright locks the final desktop Swiss-style computed values and the shared vertical mobile drawer behavior so import-order regressions fail CI.

Do not delete legacy sidebar CSS merely because a class has no current JavaScript caller. The Phase 2 cleanup already demonstrated that apparently unused mobile CSS could still affect first-paint geometry and Lighthouse CLS. Remove only rules proven to be fully overridden or migrate residual declarations explicitly with browser/performance verification.

The repository security model is a normal static Vite site deployed to Cloudflare Pages. Browser-delivered assets are public and frontend obfuscation/encryption is not a security boundary. The stale AES/key-splitting/anti-debug architecture documentation is retired.

`public/_headers` is the source of truth for repository-managed Cloudflare Pages headers. The baseline uses `nosniff`, strict-origin referrer policy, same-origin framing, limited Permissions Policy, and a compatibility-safe CSP covering `base-uri`, `object-src`, and `frame-ancestors`. A strict `script-src`/`style-src` CSP is deferred until legacy inline and third-party resources are inventoried. HSTS remains a Cloudflare zone/domain concern rather than a hard-coded static header.

The production build must verify that `dist/_headers` exists and still contains the required security baseline. Security-header regressions therefore block the same build path used by CI and deployment.

## 2026-09-14 — Lighthouse performance gates use repeated runs and a hard CLS ceiling

NAV and TDR local-production Lighthouse checks keep the existing performance threshold of `>= 0.90`; the threshold must not be lowered merely to make CI green.

A single Lighthouse run is not a reliable release gate on shared runners. `npm run test:perf` therefore runs each target three times, requires the median performance score to be `>= 0.90`, and rejects the target if any run pushes the maximum cumulative layout shift above `0.10`. Median scoring limits shared-runner timing noise, while the hard CLS ceiling prevents one unstable layout run from being hidden by two good runs. Do not replace this policy with best-of-N scoring.

The Phase 1.6 NAV investigation found that the shared mobile category drawer was initialized open. NAV then populated 19 category items after initial paint, expanding the mobile sidebar from the initial shell to about 529 px and moving `.main-content` from `y=155` to about `y=529`. That single shift produced CLS `0.3697888138556004` and reduced otherwise-fast Lighthouse runs to about `0.80-0.81`.

Desktop keeps the persistent category sidebar open by default. At widths `<= 820px`, the category drawer starts collapsed and remains accessible through the existing mobile toggle. This preserves the drawer feature while avoiding a data-driven first-paint layout shift.

The repeated post-fix validation measured NAV `0.97` in all five diagnostic runs with maximum CLS `0.08106547925749524`, and TDR `0.99` in all three runs with CLS `0`. The existing one-run repository contract also passed at NAV `0.97` and TDR `0.99` before the repeated-run policy was made permanent.

The repeated Lighthouse gate is blocking in task/PR Quality Gate and automatic `source` deployment after the production build. The local PowerShell deployment path keeps its existing dependency/unit/build safety gates instead of requiring a browser installation on every developer machine.

## 2026-09-14 — High and critical npm advisories block release paths

High- and critical-severity npm audit findings are blocking in pull-request/task-branch quality checks, automatic `source` deployment, and the local PowerShell deployment path. The permanent gate is `npm audit --audit-level=high`.

Dependency remediation must prefer removing unused direct dependencies and applying non-breaking lockfile updates. Do not use a blind `npm audit fix --force` merely to make audit output green.

The unused `@lhci/cli` dependency was removed because repository performance auditing imports `lighthouse` directly. `lighthouse` was raised from `^13.0.1` to `^13.4.1`, `chrome-launcher` is now declared directly, and the lockfile was refreshed with non-breaking npm operations. This removed the vulnerable LHCI/proxy/basic-ftp chain and the remaining vulnerable Lighthouse/ws chain in the validated audit.

The dependency-remediation comparison established that the old single-run NAV score problem was not caused by the dependency upgrade: the Phase 1 baseline measured 0.76 on a GitHub-hosted runner while the remediated dependency stack measured 0.80-0.81 before the Phase 1.6 layout fix.

## 2026-09-14 — Required quality checks block production deployment

The `source` deployment workflow must not publish when required lint, unit, smoke, dependency-audit, or Lighthouse performance checks fail. Required checks must not use `continue-on-error: true`.

Authored JavaScript is part of the lint gate. Any legacy exclusion must be explicit, path-scoped, and documented rather than disabling JavaScript lint globally. The current legacy exclusion is limited to `src/pages/tdr/static/script/**`.

Pull requests and task branches use `.github/workflows/quality-gate.yml` to run dependency audit, lint, unit tests, Playwright smoke tests, a production build, and the repeated NAV/TDR Lighthouse performance gate before merge. CI uses Node 24, while `package.json` declares Node `>=22.19` to satisfy current tooling requirements.

Accessibility debt should not be globally disabled merely to make CI green. Use a narrow temporary warning baseline only when the underlying markup cannot safely be repaired in the same task; remove that baseline when the debt is fixed.

## 2026-09-10 — NAV resources use one canonical catalog

NAV resource sections, membership, titles/descriptions, avatars, and links are owned by `src/assets/data/nav-catalog.js`.

Runtime section-replacement patch files are not used for catalog maintenance. The reason is to remove import-order overrides, stale hidden copies, and Chinese/English catalog drift.

`src/assets/data/lol-version.json` remains separate and authoritative for LOL version metadata; it is not part of the resource catalog.

## 2026-10-09 — Temporary exception for an unpatched build-tool vulnerability

The compatible `npm audit fix --package-lock-only` refresh reduced high-severity findings from 36 to 7. The remaining high-severity chain originates from `braces@3.0.3` and advisory `GHSA-vfj7-8cjw-p6xm`, which has no published fixed release as of this date. All affected lockfile nodes must be development-only; the published static site does not bundle this package. An additional `sprintf-js` advisory (`GHSA-hp3w-g68c-fv3c`) is moderate and does not affect the existing high-severity threshold.

The dependency gate invokes a full `npm audit --json --audit-level=high` and uses `scripts/audit-dependencies.js` to accept only dev-only high/critical findings rooted exclusively in this exact unpatched `braces` advisory, through 2026-11-30. Any other high/critical finding, production dependency exposure, invalid audit response, or expiry fails the release. It emits an explicit warning rather than claiming zero vulnerabilities. This is a time-limited risk exception, not a vulnerability fix. Recheck upstream and remove the exception when a patched version appears; do not downgrade Jest/Stylelint or force a breaking dependency migration merely to hide the advisory.
