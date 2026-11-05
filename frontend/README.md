# Flambe frontend

The active frontend is the React/Vite SPA in `packages/core`. Vite serves it on
port 5173 during development and proxies API, auth, and WebSocket requests to
Phoenix 1.8 on port 4001 (or to a hosted instance when `VITE_API_URL` is set).

Use Node 22 on Windows, macOS, or Linux:

```text
npm ci
npm run dev
```

To point the SPA at a hosted instance without Mix, copy `.env.example` to
`.env.local` and set `VITE_API_URL` to that origin. Log in with an account on
that instance. Writes from this Vite session go to the remote database; do not
run `mix ecto.*` against it.

```text
VITE_API_URL=https://flambe.fly.dev npm run dev
```


Use `npm run build` to place the production bundle in
`../backend/priv/static/assets`, then visit http://localhost:4001.
Root-scoped PWA files (`manifest.webmanifest`, `sw.js`, install icons) are
copied into `../backend/priv/static` so Add to Home Screen works.

```text
npm run typecheck
npm run test:unit
npm run test:smoke
npm run storybook
```

These npm scripts intentionally avoid shell-specific syntax so they run the
same way on macOS, Linux, and Windows.

Storybook renders the production Timeline / FlameChart from fixture Redux
state. It does not start Phoenix or run sagas.

## Focused browser regressions

With Storybook running on port 6006, the mobile workspace preview is
`/iframe.html?id=app-mobile-workspace--navigator&viewMode=story`.
Resize it to phone width to exercise navigation, active stacks, full-screen
Limbo, and the zoomable timeline with optional timeseries.

To run the fixture-backed browser checks (no backend needed), set
`PLAYWRIGHT_BASE_URL=http://localhost:6006`, `PLAYWRIGHT_MOBILE_STORIES=1`,
`PLAYWRIGHT_MAGIC_BUTTON_STORIES=1`, and `PLAYWRIGHT_TIMELINE_STORIES=1` in your
shell, then run:

```text
npx playwright test mobile_workspace.spec.ts magic_button.spec.ts timeline_composition.spec.ts --workers=1
```

Mobile workspace and MagicButton checks cover both Chromium and iPhone WebKit.
Install the browsers with `npx playwright install` if needed. The authenticated
`mobile_trace.spec.ts` tests still target the backend and should be run separately.

The product README is at the [repository root](../README.md).
