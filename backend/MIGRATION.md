# Phoenix 1.8 migration foundation

`backend/` is the Phoenix 1.8 application used by the React app in normal
development. Its database remains isolated from the restored legacy database,
which is retained only as an import source.

- Application name: `flambe_next`
- Development port: `4001`
- Development database: `flambe_next_dev`
- Test database: `flambe_next_test`
- Health check: `GET /api/health`

The migration is complete locally. Frozen contract fixtures, controller tests,
and Playwright flows cover the ported schemas, API responses, local-password
authentication, authorization, Channels, and primary timeline behavior. Do
not point `FlambeNext.Repo` at the restored database as a shortcut.
# Importing restored local data

The Phoenix 1.8 backend uses its own database and never mutates the legacy
database. To inspect the planned import from the restored local database:

```bash
mix flambe_next.import_legacy --dry-run
```

To replace the disposable `flambe_next_dev` data with the restored data:

```bash
mix flambe_next.import_legacy --replace
```

The default source is `flambe_legacy_restored`; override it with
`--source DATABASE` or `LEGACY_DATABASE`. The importer keeps local credentials
with password hashes, skips credentials without a local password, preserves record IDs and
timestamps, and resets destination sequences. It is deliberately guarded by
`--replace` because it truncates only the **next** database.

## Rehearse an import without touching local data

Set `FLAMBE_NEXT_DATABASE` to a newly created, disposable database before
running migrations or the importer. This lets you validate the import and a
rollback without changing `flambe_next_dev` or the legacy source:

Use `pg_dump` and `pg_restore` from the PostgreSQL server's major version (or
newer); an older `pg_dump` cannot create an archive from a newer server.

```bash
createdb flambe_next_rehearsal
FLAMBE_NEXT_DATABASE=flambe_next_rehearsal mix ecto.migrate
pg_dump --format=custom --file=/tmp/flambe-next-before-import.dump flambe_next_rehearsal
FLAMBE_NEXT_DATABASE=flambe_next_rehearsal mix flambe_next.import_legacy --replace

# Recreate the disposable database and restore the pre-import snapshot.
dropdb flambe_next_rehearsal
createdb flambe_next_rehearsal
pg_restore --dbname=flambe_next_rehearsal /tmp/flambe-next-before-import.dump
```

Use an explicit, verified database name for the `dropdb` step; it is intended
only for the throwaway rehearsal target.

# Serving the Vite SPA from backend

Build the frontend into the isolated Phoenix 1.8 app with:

```bash
cd ../frontend
nvm exec 22 npm run build
```

`backend` then serves the SPA and its `/assets` on port 4001.

# Browser smoke test

Seed the deterministic browser-test account before starting `backend`:

```bash
mix flambe_next.seed_e2e
```

With `backend` running on port 4001, run the supported browser smoke
suite against the Phoenix-served SPA:

```bash
cd ../frontend
nvm exec 22 npm run test:smoke
```

Set `PLAYWRIGHT_BASE_URL` to target another locally running stack. The suite
uses the installed Google Chrome binary; override its path with
`PLAYWRIGHT_CHROME_PATH` when necessary.
