# Local Database Workflow

Flambe's local data lives in PostgreSQL. Keep database dumps outside this Git
repository: they can contain personal history, authentication data, and other
private information.

Use PostgreSQL client tools from the same major version as the running server,
or a newer major version. An older `pg_dump` refuses to back up a newer server.

## Back up a local database

Use PostgreSQL's custom archive format so the backup can be inspected and
restored selectively:

```sh
pg_dump --format=custom --file="$HOME/flambe-backups/flambe-next-$(date +%F).dump" flambe_next_dev
```

Create the backup directory first if it does not exist. Confirm the resulting
archive with:

```sh
pg_restore --list "$HOME/flambe-backups/flambe-next-YYYY-MM-DD.dump"
```

## Restore a plain SQL dump into a new local database

Never restore over the database currently being used by the application.

```sh
createdb flambe_restore_check
psql --dbname=flambe_restore_check --file=/absolute/path/to/dump.sql
psql --dbname=flambe_restore_check --command='select count(*) from users;'
```

Point `backend/config/dev.exs` at the new database only after the row
counts and application startup have been checked.

For a custom archive created by `pg_dump --format=custom`, restore with:

```sh
createdb flambe_restore_check
pg_restore --exit-on-error --dbname=flambe_restore_check /absolute/path/to/dump.dump
```

## Rebuild the disposable test database

`flambe_next_test` contains no restored personal data and may be dropped at any
time:

```sh
cd backend
MIX_ENV=test mix ecto.drop
MIX_ENV=test mix ecto.create
MIX_ENV=test mix ecto.migrate
mix precommit
```

Do not run `mix ecto.drop`, `mix ecto.reset`, or restore commands against
`flambe_next_dev` or `flambe_legacy_restored` unless you have just made and
verified a backup. The legacy database is an import source only; use
`mix flambe_next.import_legacy --dry-run` before any `--replace` import.

For an import/rollback rehearsal, use a fresh target and set
`FLAMBE_NEXT_DATABASE` for each `backend` command. The importer will then
truncate only that explicitly named disposable database; see
[the Phoenix 1.8 migration guide](../backend/MIGRATION.md#rehearse-an-import-without-touching-local-data).
