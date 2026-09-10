# Pitfalls

## NAV resource lists split across runtime patches

**Symptom:** A resource is changed in the base catalog but the NAV page still shows another value, or Chinese/English views show different resource sets depending on which runtime override ran last.

**Cause:** Resource membership and URLs were historically duplicated between the base NAV data and runtime section-replacement files such as daily-card, weekly-card, HE, Delta Force, and general NAV patches. Import order determined which copy won.

**Prevention:** Keep all NAV resource sections and links in `src/assets/data/nav-catalog.js`. Do not add a runtime patch that replaces a resource list. When a requested change applies to both locales, update both there; otherwise preserve intentional locale-specific entries. Verify language switching does not change data based on import order.
