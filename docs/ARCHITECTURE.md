# Architecture

## NAV resource data flow

The NAV resource directory uses one canonical catalog:

```text
src/assets/data/nav-catalog.js
        ↓
src/pages/nav/data.js
        ↓
initializeResourceData()
        ↓
window.navDataTranslations / window.navData
        ↓
src/assets/js/nav-core.js
        ↓
sidebar + resource cards
```

All NAV resource sections and resource links belong in `src/assets/data/nav-catalog.js`. Runtime files must not replace whole section lists or maintain parallel copies for daily cards, weekly cards, Delta Force, HE, or other categories.

Chinese and English catalogs are both owned by this file. Locale-specific resources may differ when intentionally preserved, but a language switch must always resolve from the same canonical catalog rather than from import-order-dependent patches.

LOL patch/version metadata is intentionally separate from the resource catalog. `src/assets/data/lol-version.json` remains the only canonical NAV version source and is applied by `nav-core.js` at render time.

UI-only fixes may run after rendering, but they must not become another resource-list source of truth.
