# Flambe

The Flambe timeline application lives in `frontend/packages/core` and is backed
by the Phoenix 1.8 app in `backend`.

## Run locally

Requirements: Node 22 LTS, Elixir 1.18/OTP 27, and PostgreSQL. Native Windows,
macOS, and Linux are supported; WSL is not required.

Make sure `node --version` reports Node 22 before installing the frontend.

The backend defaults to a local PostgreSQL server at `localhost:5432` with the
username/password `postgres` / `postgres`. If your local installation differs,
set the standard PostgreSQL environment variables before running Mix. For
example, in PowerShell:

```powershell
$env:PGUSER = "postgres"
$env:PGPASSWORD = "your-password"
$env:PGHOST = "localhost"
$env:PGPORT = "5432"
```

1. Create local backend settings and start Phoenix:

   ```text
   cd backend
   mix deps.get
   mix ecto.create
   mix ecto.migrate
   mix phx.server
   ```

2. In another terminal, start the Vite development server:

   ```text
   cd frontend
   npm ci
   npm run dev
   ```

Open http://localhost:5173, create an account, and you will be taken to its
default `Main` trace. Vite proxies API, authentication, and socket requests to
Phoenix at http://localhost:4001.

To build the Phoenix-served production frontend, run `npm run build` from
`frontend`. This produces hashed assets and a manifest in
`backend/priv/static/assets`; Phoenix serves the resulting SPA and its
client-side routes at http://localhost:4001.

Flambe uses local email/password accounts only. Create an account at
`/register`, or seed the deterministic browser-test account with
`mix flambe_next.seed_e2e` from `backend`.

## Verification

With PostgreSQL available, run the checks that gate the active stack:

```text
cd backend
mix precommit

cd ../frontend
npm run typecheck
npm run test:unit
npm run build
npm run test:smoke
```

The same commands are intended to work from PowerShell, Command Prompt, and
Unix shells. CI includes a native Windows job to prevent platform-specific
regressions.

The retired Phoenix 1.3 source remains available in Git history. Legacy data
imports read directly from the isolated `flambe_legacy_restored` database; the
old application does not need to be running.

## Local data safety

See [the local database workflow](docs/LOCAL_DATABASE.md) before backing up,
restoring, or resetting a database.

For a deployment or rollback, follow the
[Phoenix 1.8 release checklist](docs/RELEASE_CHECKLIST.md).
