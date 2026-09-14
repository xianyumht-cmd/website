# Decisions

## 2026-09-14 — High and critical npm advisories block release paths

High- and critical-severity npm audit findings are blocking in pull-request/task-branch quality checks, automatic `source` deployment, and the local PowerShell deployment path. The permanent gate is `npm audit --audit-level=high`.

Dependency remediation must prefer removing unused direct dependencies and applying non-breaking lockfile updates. Do not use a blind `npm audit fix --force` merely to make audit output green.

The unused `@lhci/cli` dependency was removed because repository performance auditing imports `lighthouse` directly. `lighthouse` was raised from `^13.0.1` to `^13.4.1`, `chrome-launcher` is now declared directly, and the lockfile was refreshed with non-breaking npm operations. This removed the vulnerable LHCI/proxy/basic-ftp chain and the remaining vulnerable Lighthouse/ws chain in the validated audit.

The existing NAV/TDR Lighthouse threshold must not be lowered merely to make a shared CI runner green. The Phase 1 baseline measured NAV at 0.76 on a GitHub-hosted runner, while the remediated dependency stack measured 0.80-0.81. Treat the unmet 0.90 shared-runner threshold as separate performance-test debt, not as a dependency-remediation regression.

## 2026-09-14 — Required quality checks block production deployment

The `source` deployment workflow must not publish when required lint, unit, or smoke checks fail. Required checks must not use `continue-on-error: true`.

Authored JavaScript is part of the lint gate. Any legacy exclusion must be explicit, path-scoped, and documented rather than disabling JavaScript lint globally. The current legacy exclusion is limited to `src/pages/tdr/static/script/**`.

Pull requests and task branches use `.github/workflows/quality-gate.yml` to run lint, unit tests, Playwright smoke tests, and a production build before merge. CI uses Node 24, while `package.json` declares Node `>=22.19` to satisfy current tooling requirements.

Existing accessibility debt should be surfaced with a narrow warning baseline when it cannot safely be repaired in the same task. Do not globally disable a recommended accessibility rule merely to make CI green.

## 2026-09-10 — NAV resources use one canonical catalog

NAV resource sections, membership, titles/descriptions, avatars, and links are owned by `src/assets/data/nav-catalog.js`.

Runtime section-replacement patch files are not used for catalog maintenance. The reason is to remove import-order overrides, stale hidden copies, and Chinese/English catalog drift.

`src/assets/data/lol-version.json` remains separate and authoritative for LOL version metadata; it is not part of the resource catalog.
