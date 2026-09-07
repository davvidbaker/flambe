# Flambe

The Flambe timeline application lives in `frontend/packages/core` and is backed
by the Phoenix 1.8 app in `backend`.

**Unfinished work, uncommitted local piles, and follow-ups in other repos:**
[docs/OPEN_WORK.md](docs/OPEN_WORK.md). Docs index: [docs/README.md](docs/README.md).

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
`/register`. Production requires the shared `FLAMBE_INVITE_CODE` (see
[ADR-007](docs/ADR-007-private-fly-instance.md)); local development omits it
unless that variable is set. Seed the deterministic browser-test account with
`mix flambe_next.seed_e2e` from `backend`.

Private hosting is a single Fly.io Machine. Follow
[the Phoenix 1.8 release checklist](docs/RELEASE_CHECKLIST.md). Keep `fly scale
count` at 1; agent presence is in-memory. After a `main` deploy, `/api/health`
returns that commit’s `git_sha`; the SPA logs it on load and lists it under
Settings → Developer.

## Local mode (SQLite, no Elixir)

To keep traces on one machine (for example a work laptop) instead of the Fly
database, run the Node server from `cli`:

```sh
cd cli
flambe serve
```

It binds `127.0.0.1:4001`, creates `~/.flambe/local.sqlite` if needed, and
prints `FLAMBE_URL`, `FLAMBE_API_TOKEN`, and `FLAMBE_TRACE_ID`. Put those in
the project `.env` the CLI and agents use. Login in the browser accepts any
password and opens the local user.

The chart still lives in the Vite/Phoenix SPA. Point Vite at this process
(`VITE_API_URL=http://127.0.0.1:4001`) or pass `--static` to `backend/priv/static`
after `npm run build` in `frontend`. Live updates use the SPA’s existing 2s
trace poll when the Phoenix socket is absent.

Copy selected history onto production later:

```sh
flambe export work.json
flambe import work.json --url https://your-app.fly.dev --token flb_...
```

Import creates a **new** trace on that account (or skips if that export was
already imported). It does not upload tokens or credentials.

See [ADR-009](docs/ADR-009-local-node-sqlite-and-on-demand-import.md).

## Desktop status flame

A native helper shows whether agents have talked to Flambe in the last 30
seconds (outlined / orange / blue sparkling flame). It uses one authenticated
SSE connection to `/api/agent-status/stream`.

- macOS: [`macos/FlambeMenuBar`](macos/FlambeMenuBar/README.md)
- Windows: [`windows/FlambeTaskbar`](windows/FlambeTaskbar/README.md)

## Coding-agent CLI

Flambe can accept user-scoped bearer tokens so coding agents can stream work
into an open trace without knowing your account password. Raw tokens are shown
once; the database stores only a SHA-256 hash.

Create a token from Settings → API tokens in the logged-in app, or from
`backend` after running migrations (local Mix only):

```sh
mix flambe_next.create_api_token you@example.com "Claude"
```

Revoke tokens from the same Settings panel. The raw secret is shown once.

Install the zero-dependency Node 22 CLI from npm (other repos and Cursor Cloud):

```sh
npm install -g @davvidbaker/flambe-cli
```

CI publishes `@davvidbaker/flambe-cli` from `cli/` when `cli/package.json` on
`main` changes. From this checkout instead:

```sh
cd cli
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

On the Fly instance, set `FLAMBE_URL` to `https://your-app.fly.dev`.

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

An agent can also ask the Reducer Agent whether it is still on track:

```sh
flambe message "Auth fix needs the session module refactored too; widening scope"
```

This posts the update and the current flame to `POST /mcp` (tool
`flambe_message`) and prints `assessment`, `direction`, and `reply`. The reducer
is the single writer for the stack: it may apply one change (a child activity or
a rename), printed as `actions`. A returned `direction` is meant to be followed.
The server needs `OPENAI_API_KEY` for `message`; lifecycle events (`start`,
`end`, `suspend`, `resume`) reduce deterministically and work without it. When
an agent ends a parent with `--force` while descendants are still open, the
reducer ends those too and the CLI reports it on stderr. See
[ADR-011](docs/ADR-011-reducer-owns-the-stack.md) and
[ADR-010](docs/ADR-010-reducer-advises-worker-owned-stack.md).

Generic overlays (carbon intensity, moods, and similar) are observations, not
activities. Record them with:

```sh
flambe observe carbon 312.4 --unit gCO2eq/kWh --on 2026-09-04 --payload '{"source":"us-ba-mean"}'
```

The same `kind` + `--on` date upserts and merges `payload` keys, so a later
Pulse job can attach kWh and forecast error without replacing the intensity
fields. Omit `--on` to always insert (point-in-time moods).
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

CI runs backend checks, the agent CLI, Phoenix-served browser smoke, and a
MIX_ENV=prod smoke job.

The retired Phoenix 1.3 source remains available in Git history. Legacy data
imports read directly from the isolated `flambe_legacy_restored` database; the
old application does not need to be running.

## Local data safety

See [the local database workflow](docs/LOCAL_DATABASE.md) before backing up,
restoring, or resetting a database.

For a Fly deployment or rollback, follow the
[Phoenix 1.8 release checklist](docs/RELEASE_CHECKLIST.md).
