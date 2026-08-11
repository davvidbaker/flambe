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
cd backend
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
cd backend
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
`backend/test/fixtures/api_contracts`; their tests verify trace and thread
response shapes without embedding restored personal data.

## Current gates

| Check | Result | Coverage |
| --- | --- | --- |
| Browser smoke test | Passing locally | `npm run test:smoke` validates the Phoenix 1.8 production stack and core user flows with disposable data. |

The checked-in GitHub Actions workflow runs Phoenix 1.8 backend checks,
strict frontend TypeScript checks, frontend unit tests, and the Phoenix-served
Vite browser smoke flow against a disposable PostgreSQL service database.

The active controller and browser checks are first-class gates. The retired
Phoenix 1.3 source is available in Git history, while controlled data imports
operate directly on an explicitly selected legacy database.
