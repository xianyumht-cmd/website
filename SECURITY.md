# Security

## Current architecture

This repository builds a static Vite site and publishes static output to Cloudflare Pages. Browser-delivered JavaScript, CSS, HTML, images, and configuration must be treated as public to the visitor.

The project does **not** rely on frontend obfuscation, hidden key material, client-side asset encryption, DevTools blocking, or split secrets as a security boundary. Secrets must never be committed to the repository or embedded into browser bundles.

## Security controls

The current repository-level controls are:

- Cloudflare Pages response headers from `public/_headers`.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- Same-origin framing restrictions through `X-Frame-Options` and CSP `frame-ancestors`.
- Browser capability restrictions for camera, microphone, and geolocation through `Permissions-Policy`.
- A conservative CSP baseline restricting `base-uri`, plugins/objects, and framing without yet constraining the site's legacy script/style/CDN loading model.
- Blocking dependency audit for high/critical npm advisories in CI and deployment paths.
- Blocking lint, unit, Playwright smoke, production build, and repeated Lighthouse checks on task/PR quality gates.

A stricter `script-src` / `style-src` CSP should only be introduced after the remaining inline and third-party resources have been inventoried and migrated. Do not add a policy that breaks existing site functionality merely to obtain a stricter header score.

## Threat model and rules

### Client-side secrets

Anything shipped to the browser can be inspected by a user. API credentials, private tokens, signing keys, passwords, or other server-side secrets must not be placed in:

- Vite client environment variables,
- source files,
- generated JavaScript bundles,
- CSS custom properties,
- images or other static assets,
- service workers,
- localStorage/sessionStorage as a secrecy mechanism.

If a feature requires a real secret, it needs a trusted server-side or edge-side component that does not expose that secret to the browser.

### Dependency security

Use the repository lockfile and normal non-breaking dependency remediation first. Release paths run:

```bash
npm audit --audit-level=high
```

Do not use `npm audit fix --force` only to make the audit green. Major dependency changes require normal regression testing.

### Response headers

`public/_headers` is the source of truth for Cloudflare Pages static response headers. Changes to security headers must preserve current runtime compatibility and should be covered by automated tests.

HSTS is intentionally not hard-coded here. TLS/HSTS policy is better managed at the Cloudflare zone/domain layer because preview domains and custom domains can have different requirements.

## Supported code

Security fixes target the canonical `source` branch and the currently deployed production build. Historical commits, abandoned task branches, and old local builds are not maintained as supported releases.

## Reporting a vulnerability

Please report security issues privately rather than publishing exploit details in a normal public issue.

Preferred reporting path:

1. Use a private GitHub Security Advisory for this repository when that option is available.
2. Otherwise contact the repository owner privately and include the affected path, reproduction steps, impact, and any proposed mitigation.

Do not include real credentials, private tokens, or unrelated personal data in a report.

## Verification

For security-related repository changes, use the same release-quality path as normal code changes:

```bash
npm ci
npm audit --audit-level=high
npm run lint
npm run test:unit
npm run test:smoke
npm run build
npm run test:perf
```

Production deployment must remain blocked when required quality or dependency-security checks fail.
