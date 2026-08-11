# Flambe Modernization Plan

## Goal

Modernize Flambe without a rewrite: retain the restored database, existing React
timeline, JSON API, and Phoenix Channels while replacing the obsolete build and
runtime infrastructure in independently releasable stages.

## Current constraints

- The frontend is React 19.2 with Flow, Redux/Saga, and React Router 7.
- It uses Babel-only syntax, including Flow annotations and the pipeline
  operator, so a Vite move needs a temporary Babel compatibility layer.
- The backend began as Phoenix 1.3 / Ecto 2-era code and has compatibility
  patches for a current local Elixir/OTP runtime.
- The app currently uses separate frontend and backend origins in development,
  which makes authentication cookies and CORS unnecessarily fragile.
- Automated coverage is limited; the canvas timeline is the highest-risk UI
  surface and should not be rewritten during framework upgrades.

## Target architecture

- Phoenix 1.8 as the API, data, authentication, and realtime-Channels service.
- A React SPA built with Vite.
- In production, Phoenix serves the built SPA from `priv/static`; browser API
  calls are same-origin.
- In development, Vite proxies `/api`, `/auth`, and `/socket` to Phoenix.
- PostgreSQL remains the source of truth, with backups and migrations treated
  as release prerequisites.

Phoenix 1.8 requires Erlang/OTP 25 or newer. Current Vite requires Node
20.19+ or 22.12+; standardize on Node 22 LTS.

## Phase 0 — Establish a safe baseline

Current baseline status is tracked in
[docs/PHASE_0_BASELINE.md](docs/PHASE_0_BASELINE.md).

1. Commit the project-resurrection work separately from modernization work.
2. Create and document a repeatable PostgreSQL backup/restore procedure.
3. Add smoke tests covering:
   - local-password login and GitHub login callback handling;
   - loading a trace and rendering the flame chart;
   - creating, renaming, collapsing, and deleting a thread;
   - creating, ending, and deleting an activity;
   - persisted thread-collapse and viewport behavior after refresh.
4. Add CI for backend tests, frontend checks, and browser smoke tests.
5. Capture the current JSON responses as API-contract fixtures.

**Exit criterion:** a fresh checkout can restore a disposable database and pass
the core user-flow tests.

## Phase 1 — Replace Webpack with Vite, preserving behavior

**Status: complete locally.** Vite is the only frontend build path and is
covered by the browser smoke test. CI runs the same production flow on Node 22.

- [x] Model the maintained React app as an npm workspace; the unrelated Gatsby
  homepage package remains archived outside the active workspace.
- [x] Standardize the app and CI on Node 22 LTS.
- [x] Add a Vite dev server, Flow/pipeline-compatible Babel transform, API
  proxy, and production asset manifest.
- [x] Verify the Vite server with the login, trace-rendering, and persisted
  thread-collapse smoke flow.
- [x] Switch Phoenix to serve the Vite production build.
- [x] Replace React Hot Loader and remove the Webpack/Lerna path.

1. Flatten the frontend into one maintained app package; remove the Lerna
   dependency only after its packages are accounted for.
2. Upgrade the frontend runtime to Node 22 LTS.
3. Add Vite, the React plugin, and a temporary Babel transform compatible with
   Flow and the existing pipeline-operator syntax.
4. Replace Webpack `DefinePlugin` globals with `VITE_API_URL` and
   `VITE_SOCKET_URL` environment variables.
5. Replace React Hot Loader with Vite Fast Refresh.
6. Configure Vite's development proxy for `/api`, `/auth`, and `/socket`.
7. Configure production output to `backend/priv/static/assets`, with hashed
   assets and a generated manifest.
8. Remove the superseded Webpack configs and OpenSSL legacy workaround after
   Vite passes every smoke test.

**Exit criterion:** `npm run dev`, `npm run build`, and a Phoenix-served
production build work without Webpack or `NODE_OPTIONS=--openssl-legacy-provider`.

## Phase 2 — Modernize React incrementally

**Status: in progress.** React 19.2, the automatic JSX runtime, and the
`createRoot` API are now in place, with the browser smoke flow passing. React
Router 7 is the current compatible router line. The remaining dependency
upgrades stay separate milestones.

- [x] Upgrade React and React DOM from 16.8 to 18.3 and adopt `createRoot`.
- [x] Upgrade React and React DOM to 19.2, enable the automatic JSX runtime,
  and remove the obsolete React-16-only logo package.
- [x] Cover first-frame thread-header interaction and persisted collapse state
  in the browser smoke test.
- [x] Upgrade React Router to 7 and remove `react-router-redux`.
- [x] Keep routing outside Redux, including the unauthorized-request redirect.
- [x] Upgrade React Redux, Redux, and Redux-Saga for React 18 compatibility;
  remove unused Redux Thunk middleware.
- [x] Upgrade React Select to 5; make the thread filter safe while trace data
  is loading and cover its open/search behavior in the browser smoke flow.
- [x] Remove unused React Draggable code and its dependency.
- [x] Upgrade Styled Components to 6 and verify the application in both Vite
  development and Phoenix-served production modes.
- [x] Remove inactive React DnD and Reach UI code, including its unsafe
  hard-coded todo drop target; retain the underlying todo action for a future
  intentional interaction design.
- [x] Remove unused React Contexify and Recompose dependencies.
- [x] Replace React Measure with a native ResizeObserver bridge while
  preserving its render-prop timing for canvas sizing.
- [x] Replace the React-16-only split-pane dependency with a native splitter;
  cover timeline-divider dragging in the browser smoke flow.
- [x] Remove unused Babel and generator polyfill packages now covered by
  Vite's modern browser targets.
- [x] Remove dormant editor, visual-effect, and demo-chart code along with
  their unused React Commander and Swyzzle dependencies.
- [x] Retire the unreachable experimental Limbo visualization and its unused
  D3, topology, and search utility dependencies.
- [x] Upgrade the active color utility, Polished, to the current v4 line.
- [x] Upgrade Downshift from v3 to v9's `useCombobox` API; cover command
  palette filtering in the browser smoke flow.
- [x] Upgrade the command palette's XState machine from v4 to v5 actors and
  explicit eventless transitions.
- [x] Replace React Color with a native color-input adapter while retaining
  the existing `{ hex }` callback contract.
- [x] Update Emoji Regex to its current Unicode data release.
- [x] Restore a Node-22-compatible unit-test command and add trace-processing
  coverage for ordered and empty traces.
- [ ] Upgrade remaining UI dependencies individually.

1. Upgrade React and React DOM to a supported current release.
2. Upgrade React Router and remove `react-router-redux`; let routing live in
   the router instead of Redux.
3. Upgrade or replace obsolete UI dependencies one at a time, with a smoke-test
   run after each replacement.
4. Preserve Redux/Saga initially. Reassess state management only after routing
   and rendering are stable.
5. Migrate Flow to TypeScript gradually, starting with API models, timeline
   utilities, and reducers. Do not combine this with the Vite switch.
6. Add component tests around the timeline data transformation and empty/error
   states.

**Exit criterion:** the React app runs on a supported React/router stack and
the timeline behavior matches the Phase 0 contract tests.

## Phase 3 — Create a clean Phoenix 1.8 foundation

**Status: in progress.** `backend_next/` is an isolated Phoenix 1.8.9 API
foundation using a separate `flambe_next` application, PostgreSQL databases,
and development port 4001. The legacy backend remains the running application
on port 4000 until its routes have been migrated and contract-tested.

- [x] Generate the side-by-side Phoenix 1.8 API foundation with no HTML,
  LiveView, or frontend asset pipeline.
- [x] Add and test a database-free `GET /api/health` endpoint.
- [x] Port users, traces, and threads to the new database with automatic Main
  thread creation; preserve the empty-trace JSON fixture in a new renderer test.
- [x] Port local-password authentication with a signed session cookie and a
  protected trace read, preserving the frontend login response shape.
- [x] Port activity/event creation with ownership-scoped lookups and render a
  populated trace payload for the flame chart; category associations remain a
  separate resource migration.
- [x] Port ownership-scoped trace and thread CRUD, including automatic Main
  thread creation and legacy JSON response shapes.
- [x] Port user-owned categories and activity/category associations; render
  category IDs in populated trace events for the flame chart.
- [x] Port activity and event updates plus activity deletion with owner-scoped
  lookups and lifecycle-controller coverage.
- [x] Port the authenticated user/dashboard response with real traces and
  categories plus stable empty placeholders for unmigrated resources.
- [ ] Port the legacy API, authentication, and Channels behind contract tests.

1. Generate a fresh Phoenix 1.8 API-oriented skeleton alongside the existing
   backend. Do not mutate the working backend into an untestable large upgrade.
2. Port, in order: runtime configuration, Repo, migrations, domain contexts,
   JSON views/controllers, Channels, and tests.
3. Bring dependency versions forward deliberately: Ecto/Postgrex, Plug/Cowboy,
   Phoenix PubSub, then remaining dependencies.
4. Replace deprecated OTP/Phoenix patterns as they are ported rather than
   retaining compatibility shims.
5. Compare old and new endpoint responses against the API-contract fixtures.

**Exit criterion:** the new Phoenix app can run against a copied restored
database and satisfies all API and browser smoke tests.

## Phase 4 — Simplify authentication and authorization

1. Preserve GitHub OAuth, but move local-password login to Phoenix's current
   Accounts/authentication conventions.
2. Deliver the SPA and API from the same origin in production, removing the
   need for cross-origin credential handling.
3. Use an explicit current-user scope in context functions and apply ownership
   checks to traces, threads, activities, events, categories, and todos.
4. Decide whether Guardian remains necessary for external API clients. Browser
   sessions should use one well-tested mechanism rather than mixed custom
   Guardian/Ueberauth/session behavior.
5. Add authorization tests that prove one user cannot read or mutate another
   user's data.

**Exit criterion:** both local and GitHub login work with documented session
behavior, and data access is scoped by the authenticated user.

## Phase 5 — Cut over and retire legacy code

1. Run the old and new backends against separate copies of the database.
2. Verify browser smoke tests, API-contract fixtures, and manual timeline
   acceptance tests on a staging environment.
3. Take a pre-release database backup and rehearse rollback.
4. Deploy the Vite frontend and Phoenix 1.8 backend together.
5. After a stable release, remove old Phoenix 1.3 code, Webpack/Lerna files,
   stale generated documentation, and superseded auth code.

**Exit criterion:** the production app uses Vite and Phoenix 1.8, with a
repeatable release/rollback procedure and no runtime compatibility workarounds.

## Sequencing rules

- Do not combine the Vite, React, Phoenix, and authentication migrations in a
  single pull request.
- Never run schema-changing migrations against the restored database without a
  fresh dump and a tested rollback plan.
- Preserve the API response shapes until frontend contract tests have been
  updated intentionally.
- Treat flame-chart rendering, event chronology, and ownership checks as
  release blockers.

## Recommended first milestone

Complete Phases 0 and 1 only: a tested Vite frontend running against the
current backend. It removes the immediate Webpack/Node fragility while keeping
the database and Phoenix migration independent.

## References

- [Phoenix 1.8 release notes](https://phoenixframework.org/blog/phoenix-1-8-released)
- [Phoenix asset management](https://phoenix.hexdocs.pm/1.8.0/asset_management.html)
- [Vite getting started guide](https://vite.dev/guide/)
