# Project State

## Production status

- Canonical development branch: `source`.
- Phase 1–4 integration PR #10, `release: finalize website hardening and NAV redesign`, was squash-merged to `source` on 2026-09-15.
- Released source commit: `fc00ad5924fc6ba2213769a51edda6b7fd7c8244`.
- Production artifact branch `main` was published from that source commit as `28af653ccc3ea3e2d6674e8aa46598e117379b9a`.
- Production deployment workflow run `34898994403` completed successfully.
- Earlier stacked draft PRs #7, #8 and #9 were superseded by PR #10 and are closed without separate merges.
- PR #4 (`fix: restore native links and align resource breakpoint`) remains a separate, older unmerged follow-up. It is not part of the Phase 1–4 release and must be reviewed/rebased independently before any future merge.

## 2026-11-18 — Home and resource directories

- Home uses fluid service rows with visible descriptions and separate arrow tracks. The original service, backup and footer destinations remain available.
- NAV and Games align the search field with their results, and NAV fits its first resource card above the fold at the 375 × 667 comparison size. Both pages keep the existing search, category drawers and version data.
- NAV uses the same card minimum height before and after offscreen content becomes visible to avoid layout shifts on initial load.
- The Pac-Man font is resolved as a Vite build asset so the production HTML can load it from the relocated game route.
- Publication uses the existing local deployment procedure in [Operations](OPERATIONS.md#local-deployment). The deployment commit on `main` records its `Source SHA`.

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
- Production artifact branch `main` was published from merged source commit `8ecf4cfafe0d2be3277d8e61c2204cc8561aa155` as `7fd1c70d8472c06ed74f97a181e3431fce060710` on 2026-09-22.
- The published NAV bundle contains the repaired section-target navigation and current-category state; the later source commit `a810fc2ba57c4f2b5aa5766a03619fcb6e31f485` only closes out documentation.


## 2026-10-09 — LOL 26.20 deployment recovered

- PR #15 merged to canonical `source` as `9598063b2a912e27000870939595ca1116905d6b`.
- Recovery release run [37906865585](https://github.com/xianyumht-cmd/website/actions/runs/37906865585) passed dependency audit gate, lint, unit tests, Playwright, production build, Lighthouse and safe publication.
- Production `main` artifact commit `d65bfb0ae5395d6ed89f1845b6395b12bbed1916` records the exact merged source SHA and contains LOL 26.20 with canonical update dates 2026-10-06 / 2026-10-21.
- The local one-click maintenance command now retries production publication when the version file is already current but `main` is behind `source`. The legacy deployment workflow is manual-only.
- The time-limited development-only `braces` advisory exception is documented in `docs/DECISIONS.md` and expires 2026-11-30.

## 2026-10-09 — NAV daily/weekly card maintenance

- Retire explicitly discontinued `LSC` (daily) and `VK` (weekly) cards.
- Add `龙珠` to the daily section and `FJ`, `viperlite`, `app` to the weekly section. All four use user-supplied links; supplied access codes remain visible in the appropriate catalog descriptions.
- Apply the same membership and links to the Chinese and English catalogs in `src/assets/data/nav-catalog.js`. Other sections and cards remain unchanged.
- Catalog unit coverage and NAV browser language-switch coverage ensure deprecated cards stay absent and replacement entries persist across locales. Production publication requires the normal quality/deploy verification.

## 2026-10-18 — NAV dance guide URL

- The Chinese NAV `过炫舞专区` resource `过炫舞` points to the user-supplied Feishu document instead of its previous Yuque URL. Resource title, description, and section placement are unchanged.
- `src/assets/data/nav-catalog.js` remains the canonical owner; the English catalog intentionally has no dance section. Regression coverage checks the exact destination. Production availability must be verified after publication.

## 2026-11-19 — NAV guide links and confirmed card reconciliation

- Local task branch `fix/nav-dance-qqspeed-20261119` starts from current `origin/source` at `f7dcc3a06a160d9d39b35d3b9ddb3a0f5ad04ef8`, in the isolated worktree `D:\project2\worktrees\website-nav-links`. The original worktree's untracked `design-previews/` and `output/` directories are untouched.
- Replace the Chinese `过炫舞` destination with the user-supplied Feishu wiki `In0kwB2rliSIm2kTXxyc95Ssnwf`.
- Add `QQ飞车专区` with one resource card pointing to the supplied Feishu document `EHV9dO3I0oEGmKx9McBcrD76ngc`, in both language catalogs. Preserve the intentional absence of an English dance section.
- The user supplied eight new resource links and explicitly confirmed all eight removal candidates. Daily additions: `HE B`, `EX`; weekly additions: `LEI`, `OFF`, `乡里别`, `jinX`, `LX`, `LK`. Preserve access-code spelling and case in the catalog descriptions. The confirmed spelling `LK` supersedes the cropped-image guess `KL`; `KML` has no supplied link and is not added.
- Remove daily `DC`, `龙珠` and weekly `TSL`, `时光`/`Time`, `TAB`, `TEST`, `FJ`, `viperlite` from both locales. Preserve other resource cards and intentional locale differences, including monthly `LEI`; only the newly added weekly `LEI` uses the newly supplied destination.
- The user approved production publication of this NAV change. The preceding production build is `e41148bf6dddb8ae137df13ccd4f835bcf138b58` from source `f7dcc3a06a160d9d39b35d3b9ddb3a0f5ad04ef8`.
- Validation: clean `npm ci`; dependency audit gate passed with no high/critical findings (19 moderate findings remain); HTML/CSS/JS lint passed; 68 unit tests and 14 Playwright smoke/e2e tests passed; production build and `_headers` verification passed. Three Lighthouse runs each: NAV performance 1.00/1.00/1.00, max CLS 0.0040; TDR 1.00/1.00/1.00, max CLS 0.0000.
- After the confirmed additions/removals, lint, 68 unit tests, 14 browser tests, build/security-header verification, and the six performance runs were rerun successfully with the same scores/CLS above. Browser inspection checked all eight supplied destinations and confirmed unrelated sections, including monthly resources, stayed unchanged. Daily/weekly totals are 11/9 in both locales.
- Additional browser inspection verified keyboard activation, Chinese/English search and switching, no page errors, and no horizontal overflow at 390px. Desktop/mobile screenshots and the confirmed change checklist are saved under the current chat's `outputs/nav-update/` directory. Only KML still lacks a supplied link; it is not a placeholder in the public catalog.

## 2026-11-22 — One-click source synchronization

- Baseline for this change was remote `source` at `98383360cdd1246c4a591447906c2dac2db7ca4c`. Remote `main` commit `5712ff50cd0e40385c55c5d6ea75455c69afae88` records that source SHA.
- The script fast-forwards a clean, behind-only checkout before updating the NAV version. Dry-run leaves the local branch in place. Local-only commits require reconciliation.
- Windows PowerShell 5.1 passed seven local-remote CLI scenarios with real Git and stubbed updater/deployment commands. The 69 unit tests and the NAV version lifecycle browser test passed separately.
- PR #18 also pins Quality Gate to Ubuntu 24.04 after the floating runner moved to an OS unsupported by locked Playwright 1.58.1.
