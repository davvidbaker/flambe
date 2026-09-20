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

Use `npm run build` to place the production bundle in
`../backend/priv/static/assets`, then visit http://localhost:4001.

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

The product README is at the [repository root](../README.md).
