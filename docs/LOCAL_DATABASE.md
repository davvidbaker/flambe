# Local Database Workflow

Flambe's local data lives in PostgreSQL. Keep database dumps outside this Git
repository: they can contain personal history, authentication data, and other
private information.

## Back up a local database

Use PostgreSQL's custom archive format so the backup can be inspected and
restored selectively:

```sh
pg_dump --format=custom --file="$HOME/flambe-backups/flambe-$(date +%F).dump" flambe_legacy_restored
```

Create the backup directory first if it does not exist. Confirm the resulting
archive with:

```sh
pg_restore --list "$HOME/flambe-backups/flambe-YYYY-MM-DD.dump"
```

## Restore a SQL dump into a new local database

Never restore over the database currently being used by the application.

```sh
createdb flambe_restore_check
psql --dbname=flambe_restore_check --file=/absolute/path/to/dump.sql
psql --dbname=flambe_restore_check --command='select count(*) from users;'
```

Point `backend/config/dev.secret.exs` at the new database only after the row
counts and application startup have been checked.

## Rebuild the disposable test database

`flambe_test` contains no restored personal data and may be dropped at any
time:

```sh
cd backend
MIX_ENV=test mix ecto.drop
MIX_ENV=test mix ecto.create
MIX_ENV=test mix ecto.migrate
mix test
```

Do not run `mix ecto.drop`, `mix ecto.reset`, or restore commands against
`flambe_legacy_restored` unless you have just made and verified a backup.
