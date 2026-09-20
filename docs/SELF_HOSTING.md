# Host your own Flambe

This is the production shape: one Phoenix 1.8 release, one PostgreSQL database,
invite-gated `/register`, and a single Machine so in-memory agent presence stays
truthful.

Fly.io is the path this repository ships (`Dockerfile` and `fly.toml`). The
same image runs anywhere you can give it Postgres and the secrets below.

Local SQLite (`flambe serve`) is a loopback laptop runtime, not this. Cloud
agents cannot reach `127.0.0.1`. See the [root README](../README.md#try-it-on-one-machine).

## What you get

- The SPA, REST API, Phoenix Channels, MCP (`/mcp`), and CLI command endpoint
  from one origin
- Email/password accounts; production signup requires `FLAMBE_INVITE_CODE`
- API tokens minted in Settings (or Mix, locally only)
- Optional reducer model review when `OPENAI_API_KEY` is set
- Optional public timeline shares (separate Vercel viewer + blob storage)

Out of scope for this deploy: email delivery, password reset, and horizontal
scale. Accounts are email plus password; there is no mailer.

## Requirements

- A [Fly.io](https://fly.io) account and [`flyctl`](https://fly.io/docs/flyctl/install/)
- Docker, if you build or run the image off Fly
- Node 22 and Elixir 1.18 / OTP 27 only if you develop or generate secrets with Mix

The checked-in `fly.toml` is named `flambe` (region `dfw`, 512 MB, one
shared CPU, `auto_stop_machines = "off"`). Change `app` before you deploy;
that name is global on Fly.

## Fly.io

From the repository root.

### 1. Create the app

```sh
fly apps create your-flambe
```

Set `app = "your-flambe"` in `fly.toml` (or pass `--app` on every command).
Pick a region close to you; the file's `primary_region` should match.

### 2. Create and attach Postgres

`fly.toml` is tuned for **Fly Postgres** on the private network:
`ECTO_IPV6 = "true"` and `ECTO_SSL = "false"`.

```sh
fly postgres create --name your-flambe-db --region dfw
fly postgres attach your-flambe-db --app your-flambe
```

That sets `DATABASE_URL`. Save the cluster password Fly prints.

[Managed Postgres](https://fly.io/docs/mpg/) (`fly mpg create` / `fly mpg attach`)
also provides `DATABASE_URL`. If the pooled URL requires TLS, set
`ECTO_SSL=true` (in `fly.toml` `[env]` or as a secret). Do not assume the
checked-in IPv6/SSL defaults still apply.

### 3. Set secrets

```sh
fly secrets set \
  SECRET_KEY_BASE="$(openssl rand -base64 64)" \
  FLAMBE_INVITE_CODE="a-long-random-invite-string" \
  PHX_HOST="your-flambe.fly.dev"
```

| Secret | Required | Purpose |
|--------|----------|---------|
| `SECRET_KEY_BASE` | yes | Cookie and secret signing. Mix equivalent: `mix phx.gen.secret` |
| `DATABASE_URL` | yes | Set by `fly postgres attach` / `fly mpg attach` |
| `FLAMBE_INVITE_CODE` | yes | Shared signup gate. Production refuses to boot without it |
| `PHX_HOST` | if `FLY_APP_NAME` is unset | Public hostname, e.g. `your-flambe.fly.dev` |
| `OPENAI_API_KEY` | no | Reducer `flambe message` and async root placement |
| `FLAMBE_REDUCER_PRIMARY_MODEL` | no | Defaults to `gpt-5.6-luna` |
| `FLAMBE_REDUCER_ESCALATION_MODEL` | no | Defaults to `gpt-5.6-terra` |
| `FLAMBE_SHARE_VIEWER_URL` | no | Origin of the public share viewer |
| `VERCEL_BLOB_READ_WRITE_TOKEN` | no | Upload frozen timeline snapshots |

`ECTO_IPV6` and `ECTO_SSL` are already in `fly.toml`. Leave Machine count at 1
(`fly scale count 1`). Presence is in-memory.

### 4. Deploy

```sh
fly deploy --build-arg GIT_SHA=$(git rev-parse HEAD)
```

The release command runs `/app/bin/migrate`. Confirm:

```sh
curl -sS "https://your-flambe.fly.dev/api/health"
```

You should see `"status"` and a `git_sha` matching that commit. The SPA logs
the same SHA on load and lists it under Settings → Developer.

### 5. First login

1. Open `https://your-flambe.fly.dev/register` and create an account with the
   invite code.
2. Settings → API tokens: mint a token for the CLI (shown once).
3. In each project agents should report into:

   ```dotenv
   FLAMBE_URL=https://your-flambe.fly.dev
   FLAMBE_API_TOKEN=flb_...
   FLAMBE_TRACE_ID=1
   ```

MCP is `https://your-flambe.fly.dev/mcp` with `Authorization: Bearer <token>`.

### GitHub Actions deploy

A push to `main` deploys after the Modernization validation workflow is green,
using `fly.toml`'s app name and the `FLY_API_TOKEN` Actions secret (a Fly
deploy token for **your** app).

To deploy by hand: `fly deploy --build-arg GIT_SHA=$(git rev-parse HEAD)`.

If you fork this repository, either set `FLY_API_TOKEN` for your app or drop
the `deploy-fly` job. Without the secret the job fails; it will not deploy
someone else's app.

## Docker on another host

Build from the repository root:

```sh
docker build -t flambe --build-arg GIT_SHA=$(git rev-parse HEAD) .
```

Run **one** replica against PostgreSQL 14+ (CI uses 14). Provide TLS to the
database unless you are on a trusted private network and set `ECTO_SSL=false`.

```sh
export DATABASE_URL="postgres://USER:PASS@HOST/flambe"
export SECRET_KEY_BASE="$(openssl rand -base64 64)"
export FLAMBE_INVITE_CODE="a-long-random-invite-string"
export PHX_HOST="flambe.example.com"

docker run --rm \
  -e DATABASE_URL -e SECRET_KEY_BASE -e FLAMBE_INVITE_CODE -e PHX_HOST \
  flambe /app/bin/migrate

docker run --rm -p 4000:4000 \
  -e DATABASE_URL -e SECRET_KEY_BASE -e FLAMBE_INVITE_CODE \
  -e PHX_HOST -e PHX_URL_SCHEME="https" \
  -e ECTO_SSL="true" -e POOL_SIZE="5" \
  flambe
```

The image's `bin/server` sets `PHX_SERVER=true`. Point a reverse proxy at
port 4000 and terminate HTTPS there. On Fly, `release_command` already runs
`/app/bin/migrate` before the new Machine starts.

Keep a single instance. Two replicas split `/api/agent-status/stream`.

## Public timeline shares (optional)

Frozen snapshots are **not** served from the private origin. Phoenix uploads
JSON to Vercel Blob; a static viewer loads `/s/:id`.

1. Deploy the share viewer from `frontend` as in
   [`frontend/packages/share-viewer/README.md`](../frontend/packages/share-viewer/README.md).
2. Set `FLAMBE_SHARE_VIEWER_URL` and `VERCEL_BLOB_READ_WRITE_TOKEN` on the
   Phoenix app.

Without those secrets, sharing stays disabled. See
[ADR-016](ADR-016-frozen-public-timeline-snapshots.md).

## Backup and rollback

- Fly: snapshot Postgres before a deploy that ships migrations. Roll back the
  image (`fly releases` / `fly deploy --image`) **before** restoring a schema
  that moved.
- Off Fly: `pg_dump` / `pg_restore` from the same major version or newer, into
  a database that is not the live one until you have checked it.

The [release checklist](RELEASE_CHECKLIST.md) is the operator script for the
existing Fly app in this repo (health SHA, invite, smoke). Use this guide for
a **new** instance.

## Related

- [ADR-007](ADR-007-private-fly-instance.md) — private Fly instance, invite code, one Machine
- [ADR-009](ADR-009-local-node-sqlite-and-on-demand-import.md) — laptop SQLite vs this deploy
- [Local database workflow](LOCAL_DATABASE.md) — Mix/Postgres on a development machine
