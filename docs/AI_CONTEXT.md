# AI Context

## NAV catalog

The resource navigation page is data-driven. Its canonical resource catalog is `src/assets/data/nav-catalog.js`; `src/pages/nav/data.js` initializes the runtime data consumed by `src/assets/js/nav-core.js`.

Resource-list patch files are intentionally not part of the design. Chinese and English catalogs are both maintained in this canonical file. Preserve intentional locale-specific differences, and update both locales together when a requested resource change applies to both.

LOL version metadata is a separate concern owned by `src/assets/data/lol-version.json`.
