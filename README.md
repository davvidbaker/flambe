# Flambe

The Flambe timeline application lives in `frontend/packages/core` and is backed
by the Phoenix 1.8 app in `backend`.

## Run locally

Requirements: Node 22 LTS, Elixir 1.18/OTP 27, and PostgreSQL.

1. Create local backend settings (adjust the PostgreSQL credentials if needed):

   ```sh
   cd backend
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

An agent records a meaningful unit of work with a begin/end pair:

```sh
ACTIVITY_ID=$(flambe start "Inspect authentication flow")
flambe end "$ACTIVITY_ID" "Confirmed bearer-token path"
```

Use `flambe threads` to list threads; the `default` row is the thread selected
when `start` has no `--thread ID`. Use `--thread ID` to target another thread.
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
work that has started but has not ended; it includes each activity's thread name
and category IDs.
`flambe ping` verifies connectivity. The commands print machine-friendly IDs
or JSON on stdout so agents can capture them easily.
The server persists each event first and then broadcasts it over Phoenix
Channels, so any open FlameChart updates live.

Agent instructions should ask for semantic work units (investigate, implement,
test, debug), not every shell command or hidden reasoning step.

## Verification

With PostgreSQL available, run the checks that gate the active stack:

```sh
cd backend
mix precommit

cd ../cli
npm test

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
