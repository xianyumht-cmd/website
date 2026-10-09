# Pitfalls

## NAV resource lists split across runtime patches

**Symptom:** A resource is changed in the base catalog but the NAV page still shows another value, or Chinese/English views show different resource sets depending on which runtime override ran last.

**Cause:** Resource membership and URLs were historically duplicated between the base NAV data and runtime section-replacement files such as daily-card, weekly-card, HE, Delta Force, and general NAV patches. Import order determined which copy won.

**Prevention:** Keep all NAV resource sections and links in `src/assets/data/nav-catalog.js`. Do not add a runtime patch that replaces a resource list. When a requested change applies to both locales, update both there; otherwise preserve intentional locale-specific entries. Verify language switching does not change data based on import order.

## NAV section anchors attached to hidden decorative elements

**Symptom:** Clicking a sidebar category updates the URL hash but the main directory does not visibly move to that category.

**Cause:** The category ID was attached to the decorative icon inside the section heading. The NAV visual layer later hid that icon with `display: none`, leaving the fragment target without a usable layout box.

**Prevention:** Put each category ID on the visible `.resource-section` element itself. Decorative heading icons must not own navigation targets. Keep an end-to-end test that clicks a real sidebar category, verifies the section is visible/in viewport, and checks the current-location state.


## One-click update pushed but production stayed stale

**Symptom:** The canonical LOL version in `source` is newer than the NAV page, and rerunning the updater exits early without deploying.

**Cause:** A validation failure after pushing source can prevent publication, but the original no-change branch treated the current JSON as proof that `main` had been deployed. The legacy workflow also still listened for source pushes despite local deployment being authoritative.

**Prevention:** Check the source SHA recorded in `origin/main` before a no-op. When production is behind, reuse the same guarded deployment path without a duplicate source commit. Keep the legacy deploy workflow manual-only; do not ignore dependency-audit failures.
