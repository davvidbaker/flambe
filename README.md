# Flambe

The Flambe timeline application lives in `frontend/packages/core` and is backed
by the Phoenix 1.8 app in `backend`.

## Run locally

Requirements: Node 22 LTS, Elixir 1.18/OTP 27, and PostgreSQL. Native Windows,
macOS, and Linux are supported; WSL is not required.

On Windows, also install Visual Studio Build Tools with the **Desktop
development with C++** workload. Flambe currently uses `bcrypt_elixir`, whose
native password-hashing extension must be compiled with the Windows C++
toolchain. The repo's Windows scripts locate and activate that toolchain for
you.

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

1. Prepare and start the backend.

   On Windows (PowerShell or Command Prompt):

   ```text
   cd backend
   scripts\windows_setup.cmd
   mix phx.server
   ```

   On macOS or Linux:

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

## Coding-agent CLI

Flambe can accept user-scoped bearer tokens so coding agents can stream work
into an open trace without knowing your account password. Raw tokens are shown
once; the database stores only a SHA-256 hash.

Create a token from `backend` after running migrations:

```sh
mix flambe_next.create_api_token you@example.com "Claude"
```

Install the zero-dependency Node 22 CLI from this checkout:

```sh
cd ../cli
npm link
```

Configure the project where the coding agent runs by adding a `.env` file in
that project's working directory. You can copy Flambe's checked-in template:

```sh
cp /path/to/flambe/.env.example .env
```

Then set the three values:

```dotenv
FLAMBE_URL=http://localhost:4001
FLAMBE_API_TOKEN=flb_...
FLAMBE_TRACE_ID=1
```

The CLI loads `.env` from its current working directory automatically and
discovers the trace's lowest-rank thread. Existing shell environment variables
take precedence over values in `.env`, which makes one-off overrides and CI
configuration predictable. `.env` is ignored by this repository and should not
be committed because it contains the bearer token.

Agent identity is separate from the token. The CLI sends a per-session
`FLAMBE_AGENT_ID` automatically in Codex, Cursor, and Claude Code agent shells,
and a `FLAMBE_AGENT_NAME` when that variable is set in the process environment.
If the agent omits a name, Flambe uses the API token name (the `"Claude"`
argument above) and then a generated instance name. Do not put `FLAMBE_AGENT_ID`
or `FLAMBE_AGENT_NAME` in `.env`; that would collapse concurrent agents onto one
lane.

An agent records a meaningful unit of work with a begin/end pair:

```sh
ACTIVITY_ID=$(flambe start "Inspect authentication flow")
flambe suspend "$ACTIVITY_ID" "Waiting for product decision"
flambe resume "$ACTIVITY_ID" "Decision received"
flambe end "$ACTIVITY_ID" "Confirmed bearer-token path"
```

Use `flambe threads` to list threads; the `default` row is the thread selected
when `start` has no `--thread ID`. Use `--thread ID` to target another thread.
By default, `start` makes the newest active activity in that thread its parent,
so an agent records a nested work tree. Use `--parent ID` to choose a parent
explicitly, or `--root` to deliberately begin a top-level workstream.
Use `flambe categories` to list category IDs, then repeat `--category ID` to
associate categories with a new activity:

```sh
flambe start "Investigate authentication" --thread 14 --category 3 --category 8
```

To record work that began earlier, pass an ISO-8601 timestamp with an explicit
timezone. Omitting `--started-at` records the current time as before:

```sh
flambe start "Agent logging" --thread 1 --started-at "2026-09-01T20:00:00-06:00"
```

Use `flambe status --active --json` at the start of an agent session to inspect
currently active work. Also use `flambe status --suspended --json` to find
paused activities that may match the current request and should be resumed.
Both include each activity's thread name, category IDs, and its root-to-activity
path.
`flambe ping` verifies connectivity. The commands print machine-friendly IDs
or JSON on stdout so agents can capture them easily.
The server persists each event first and then broadcasts it over Phoenix
Channels, so any open FlameChart updates live.

Agent instructions should ask for semantic work units (investigate, implement,
test, debug), not every shell command or hidden reasoning step.

## Verification

With PostgreSQL available, run the checks that gate the active stack.

On Windows:

```text
cd backend
scripts\windows_check.cmd

cd ..\frontend
npm run typecheck
npm run test:unit
npm run build
npm run test:smoke
```

On macOS or Linux:

```text
cd backend
mix precommit

cd ../cli
npm test

cd ../frontend
npm run typecheck
npm run test:unit
npm run build
npm run test:smoke
```

CI runs the complete backend and frontend stack on a native Windows runner,
including starting Phoenix and exercising the Playwright browser smoke test, so
platform-specific regressions are caught continuously.

The retired Phoenix 1.3 source remains available in Git history. Legacy data
imports read directly from the isolated `flambe_legacy_restored` database; the
old application does not need to be running.

## Local data safety

See [the local database workflow](docs/LOCAL_DATABASE.md) before backing up,
restoring, or resetting a database.

For a deployment or rollback, follow the
[Phoenix 1.8 release checklist](docs/RELEASE_CHECKLIST.md).
