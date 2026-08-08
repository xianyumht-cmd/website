# Operations

## Performance validation

### Local regression threshold

Run:

```text
npm run build
npm run test:perf
```

This keeps the existing deterministic local Lighthouse threshold checks for `/down/nav/` and `/down/tdr/`.

### Real production performance audit

Run:

```text
npm run test:perf:prod
```

Default production origin:

```text
https://xn--8pv109c.top
```

The production audit covers:

- `/`
- `/down/nav/index.html`
- `/down/games/index.html`

The command writes a Lighthouse JSON report under `logs/`. It is intentionally a measurement command rather than a hard release threshold because real network and third-party services vary between runs.

To audit another deployed origin, set `PRODUCTION_BASE_URL` before running the command. `CHROME_PATH` remains supported; otherwise the script uses Playwright Chromium when available.

## Performance policy

- Treat actual visitor speed, mobile responsiveness, broken core paths, and unnecessary third-party blocking as high-value issues.
- Do not optimize purely for smaller source files when production gzip/brotli size is already small and the user-visible bottleneck is elsewhere.
- Keep hashed `/assets/*` long-cache behavior unless production evidence shows a cache problem.
- Third-party analytics and visitor widgets should not sit on the HTML parsing/first-render critical path.
