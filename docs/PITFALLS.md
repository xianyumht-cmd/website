# Pitfalls

## Do not intercept working anchor navigation without a product need

- Failure pattern: a page already has a valid `<a href>` but legacy JavaScript calls `preventDefault()` and replaces browser navigation with `window.open()`.
- Risk: popup or embedded-browser restrictions can turn a normally reliable business link into a click that appears to do nothing.
- Prevention: keep configuration-driven href synchronization if needed, but let standard anchors perform navigation. Only intercept clicks when the product behavior truly requires it.

## Keep responsive breakpoints consistent across shell and controls

- Failure pattern: the resource-page shell used a 768px mobile breakpoint while the shared category drawer used 820px.
- Risk: widths from 769px through 820px enter a mixed desktop/mobile state, such as a 250px desktop sidebar combined with mobile controls.
- Prevention: when changing a shared responsive breakpoint, verify the page shell, sidebar/controller JavaScript, and final override CSS use the same boundary. Add a regression viewport inside the previous gap (currently 810px).
