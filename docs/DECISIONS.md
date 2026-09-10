# Decisions

## 2026-09-10 — NAV resources use one canonical catalog

NAV resource sections, membership, titles/descriptions, avatars, and links are owned by `src/assets/data/nav-catalog.js`.

Runtime section-replacement patch files are not used for catalog maintenance. The reason is to remove import-order overrides, stale hidden copies, and Chinese/English catalog drift.

`src/assets/data/lol-version.json` remains separate and authoritative for LOL version metadata; it is not part of the resource catalog.
