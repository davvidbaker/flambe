# Phoenix 1.8 release and rollback checklist

Operator script for the Fly.io app in this repository. For a **new** instance,
start with [SELF_HOSTING.md](SELF_HOSTING.md).

Use this checklist when promoting the Phoenix 1.8/Vite stack to that private
Fly.io app. Do not run these commands against `flambe_legacy_restored`.

The deploy shape is recorded in [ADR-007](ADR-007-private-fly-instance.md):
one Fly Machine, Fly Postgres, invite-code registration.

## Before release

1. Confirm the target PostgreSQL database. Do not use `flambe_legacy_restored`.
2. Use `pg_dump` and `pg_restore` from the PostgreSQL server's major version
   or newer. On Fly, also take a Postgres snapshot before deploy.
3. Create a custom-format backup of local data if you still keep a laptop copy:

   ```sh
   export FLAMBE_BACKUP_DIR=/absolute/path/outside/the-repository
   pg_dump --format=custom \
     --file="$FLAMBE_BACKUP_DIR/flambe-next-pre-release.dump" \
     flambe_next_dev
   pg_restore --list "$FLAMBE_BACKUP_DIR/flambe-next-pre-release.dump"
   ```

4. Run the release gates (includes MIX_ENV=prod CI via `prod-mode-smoke`):

   ```sh
   cd backend
   mix precommit

   cd ../frontend
   nvm exec 22 npm run typecheck
   nvm exec 22 npm run test:unit
   nvm exec 22 npm run build
   nvm exec 22 npm run test:smoke
   ```

5. Confirm these Fly secrets exist (`fly secrets list`):

   - `SECRET_KEY_BASE` — `mix phx.gen.secret`
   - `DATABASE_URL` — attached by `fly postgres attach`
   - `FLAMBE_INVITE_CODE` — shared signup secret
   - `PHX_HOST` — `your-app.fly.dev` (optional if `FLY_APP_NAME` is set)

   `ECTO_IPV6=true` and `ECTO_SSL=false` are set in `fly.toml` for Fly
   Postgres over the private network. Keep Machine count at 1.

## Deploy

A push to `main` deploys after the Modernization validation workflow is green
(`backend`, `cli`, `browser-smoke`, and `prod-mode-smoke`). That job needs the
GitHub Actions secret `FLY_API_TOKEN` (a Fly deploy token for app `flambe`).

To deploy by hand from the repository root:
`fly deploy --build-arg GIT_SHA=$(git rev-parse HEAD)`.

1. The release command runs `/app/bin/migrate`.
2. Verify `GET https://$PHX_HOST/api/health` returns `status` and `git_sha`
   matching that commit. The SPA logs the same SHA on load and shows it under
   Settings → Developer.
3. Create an account at `/register` with `FLAMBE_INVITE_CODE`.
4. In Settings → API tokens, mint a CLI token. Point project `.env` at
   `FLAMBE_URL=https://$PHX_HOST`.
5. Optionally run
   `PLAYWRIGHT_BASE_URL=https://$PHX_HOST PLAYWRIGHT_INVITE_CODE=... nvm exec 22 npm run test:smoke`
   against a disposable account.

## Roll back

1. Deploy the previous image (`fly releases` / `fly deploy --image`) before
   restoring data if the schema moved.
2. Restore Postgres from the pre-deploy snapshot or a `pg_restore` into the
   Fly database only — never into `flambe_legacy_restored`.
3. Check `/api/health` and login.
4. Record the reason for rollback before another release.

The retired Phoenix 1.3 source is available in Git history. Its database is not
a deployment target and remains usable as a read-only import source.
