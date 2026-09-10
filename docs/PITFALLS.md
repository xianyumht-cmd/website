# Pitfalls

## NAV resource lists split across runtime patches

**Symptom:** A resource is changed in the base catalog but the NAV page still shows another value, or Chinese/English views show different resource sets.

**Cause:** Resource membership and URLs were historically duplicated between the base NAV data and runtime section-replacement files such as daily-card, weekly-card, HE, Delta Force, and general NAV patches. Import order determined which copy won.

**Prevention:** Keep all NAV resource sections and links in `src/assets/data/nav-catalog.js`. Do not add a runtime patch that replaces a resource list. For a catalog change, update both locales in the canonical catalog and verify their section IDs/order/resource URLs stay aligned.
