# Flambe

The Flambe timeline application lives in `frontend/packages/core` and is backed
by the Phoenix 1.8 app in `backend_next`.

## Run locally

Requirements: Node 22 LTS, Elixir 1.18/OTP 27, and PostgreSQL.

1. Create local backend settings (adjust the PostgreSQL credentials if needed):

   ```sh
   cd backend_next
   mix deps.get
   mix ecto.create
   mix ecto.migrate
   mix phx.server
   ```

2. In another terminal, start the Vite development server:

   ```sh
   cd frontend
   nvm exec 22 npm ci
   nvm exec 22 npm run dev
   ```

Open http://localhost:5173, create an account, and you will be taken to its
default `Main` trace. Vite proxies API, authentication, and socket requests to
Phoenix at http://localhost:4001.

To build the Phoenix-served production frontend, run `nvm exec 22 npm run
build`. This produces hashed assets and a manifest in
`backend_next/priv/static/assets`; Phoenix serves the resulting SPA and its
client-side routes at http://localhost:4001.

Flambe uses local email/password accounts only. Create an account at
`/register`, or seed the deterministic browser-test account with
`mix flambe_next.seed_e2e` from `backend_next`.

## Verification

With PostgreSQL available, run the checks that gate the active stack:

```sh
cd backend_next
mix precommit

cd ../frontend
nvm exec 22 npm run typecheck
nvm exec 22 npm run test:unit
nvm exec 22 npm run build
nvm exec 22 npm run test:smoke
```

The retired Phoenix 1.3 source remains available in Git history. Legacy data
imports read directly from the isolated `flambe_legacy_restored` database; the
old application does not need to be running.

## Local data safety

See [the local database workflow](docs/LOCAL_DATABASE.md) before backing up,
restoring, or resetting a database.

For a deployment or rollback, follow the
[Phoenix 1.8 release checklist](docs/RELEASE_CHECKLIST.md).
