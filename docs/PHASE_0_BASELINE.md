# Phase 0 Baseline

This document records the starting point for the modernization work. It is a
status report, not a claim that the legacy app is fully covered by tests.

## Reproducible local data

The backup, restore, and disposable test-database workflow is documented in
[LOCAL_DATABASE.md](LOCAL_DATABASE.md). The `flambe_test` database was rebuilt
from the checked-in migrations on August 6, 2026; it is intentionally separate
from the restored personal-data database.

## Passing core checks

Run the focused backend regression suite with:

```sh
cd backend
mix test test/flambe/core_flow_test.exs
```

It currently verifies:

- a local password authenticates and produces a Guardian refresh token that can
  be exchanged for an access token;
- a newly created thread is present in the trace payload consumed by the
  frontend; and
- deleting a thread also deletes its attention records.

The local browser smoke flow uses a deterministic development/test account and
requires a running frontend and backend:

```sh
cd backend
mix flambe.seed_e2e

cd frontend
env -u ELECTRON_RUN_AS_NODE npm run cypress:smoke
```

It verifies login, visible flame-chart canvas, and persisted thread-collapse
state after a browser refresh. It never reads or mutates restored personal
history. Set `FLAMBE_E2E_PASSWORD` before seeding to override the local default.

Redacted API-contract fixtures live in
`backend/test/fixtures/api_contracts`; their test verifies the trace and thread
response shapes without embedding restored personal data.

## Known baseline failures

These failures are intentionally visible so modernization work has an honest
starting point.

| Check | Result | Why it is not a gate yet |
| --- | --- | --- |
| `backend: mix test` | 83 tests, 61 failures | Most historical controller tests use removed helpers or obsolete endpoint contracts. Request-dispatch tests also raise an unhelpful `FunctionClauseError` under Phoenix 1.3 on the current Elixir runtime. |
| `frontend: jest packages/core/src/utilities/zoom.test.js --runInBand` | Fails before tests run | The legacy `babel-jest` integration crashes on current Node (`Cannot read properties of undefined (reading 'cwd')`). |
| Browser smoke test | Passing locally | `npm run cypress:smoke` validates local login, trace load, flame-chart visibility, and persisted collapse state when credentials are supplied. |

The checked-in GitHub Actions workflow runs the focused backend and browser
smoke checks against disposable PostgreSQL service databases. It does not run
the failing legacy suite as a required check.

Do not hide these failures by removing tests or by making CI ignore them. Phase 0
continues with small, working regression tests while the obsolete suites are
repaired or replaced. The controller and browser portions become first-class
gates during the Vite and Phoenix upgrades.

## Next Phase 0 work

1. Add interaction coverage for creating, renaming, and deleting threads and
   activities.
2. Repair or replace the broken legacy controller and Jest harnesses, then add
   CI only for checks that are genuinely reliable.
