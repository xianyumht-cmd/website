# Decisions

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

Existing accessibility debt should be surfaced with a narrow warning baseline when it cannot safely be repaired in the same task. Do not globally disable a recommended accessibility rule merely to make CI green.

## 2026-09-10 — NAV resources use one canonical catalog

NAV resource sections, membership, titles/descriptions, avatars, and links are owned by `src/assets/data/nav-catalog.js`.

Runtime section-replacement patch files are not used for catalog maintenance. The reason is to remove import-order overrides, stale hidden copies, and Chinese/English catalog drift.

`src/assets/data/lol-version.json` remains separate and authoritative for LOL version metadata; it is not part of the resource catalog.
