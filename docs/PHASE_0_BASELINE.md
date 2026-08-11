# Phase 0 Baseline

This document records the starting point for the modernization work. It is a
status report, not a claim that the legacy app is fully covered by tests.

## Reproducible local data

The backup, restore, and disposable test-database workflow is documented in
[LOCAL_DATABASE.md](LOCAL_DATABASE.md). The `flambe_next_test` database is
rebuilt from the checked-in Phoenix 1.8 migrations and remains separate from
the restored personal-data database.

## Passing core checks

Run the active backend regression suite with:

```sh
cd backend_next
mix precommit
```

It currently verifies:

- local-password registration, login, logout, and authenticated Channels;
- ownership-scoped trace, thread, activity, event, category, todo, and
  dashboard APIs; and
- Phoenix-served SPA routing and frozen API response contracts.

The supported browser smoke flow uses Playwright and a deterministic
development/test account. It can run against the Vite dev server or a
Phoenix-served production bundle:

```sh
cd backend_next
mix flambe_next.seed_e2e

cd frontend
nvm exec 22 npm run test:smoke

# after `npm run build` and starting Phoenix 1.8 (the normal local stack)
nvm exec 22 npm run build
nvm exec 22 npm run test:smoke
```

It verifies registration, login, visible flame-chart canvas, persisted
thread-collapse state, authenticated thread CRUD, command-palette activity
creation, and logout. It never reads or mutates restored personal history. Set
`FLAMBE_E2E_PASSWORD` before seeding to override the local default.

Redacted API-contract fixtures live in
`backend_next/test/fixtures/api_contracts`; their tests verify trace and thread
response shapes without embedding restored personal data.

## Known baseline failures

These failures are intentionally visible so modernization work has an honest
starting point.

| Check | Result | Why it is not a gate yet |
| --- | --- | --- |
| `backend/` legacy test suite | Not a gate | The old Phoenix 1.3 app remains only for comparison and controlled data import while retirement is completed. |
| Browser smoke test | Passing locally | `npm run test:smoke` validates the Phoenix 1.8 production stack and core user flows with disposable data. |

The checked-in GitHub Actions workflow runs Phoenix 1.8 backend checks,
frontend unit tests, and the Phoenix-served Vite browser smoke flow against a
disposable PostgreSQL service database.

The active controller and browser checks are first-class gates. Do not restore
the legacy stack as a default CI target; add compatibility checks only when they
are needed to validate an import or an intentional migration.

## Next Phase 0 work

1. Add interaction coverage for remaining activity lifecycle commands.
2. Rehearse a backup, import, and rollback before deleting the legacy source.
