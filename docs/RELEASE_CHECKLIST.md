# Phoenix 1.8 release and rollback checklist

Use this checklist when promoting the Phoenix 1.8/Vite stack beyond local
development. It deliberately keeps the restored legacy database out of the
deployment target.

## Before release

1. Confirm the target PostgreSQL database name and host. Do not run these
   commands against `flambe_legacy_restored`.
2. Use `pg_dump` and `pg_restore` from the PostgreSQL server's major version
   or newer.
3. Create a custom-format backup outside the repository and inspect it:

   ```sh
   export FLAMBE_BACKUP_DIR=/absolute/path/outside/the/repository
   pg_dump --format=custom \
     --file="$FLAMBE_BACKUP_DIR/flambe-next-pre-release.dump" \
     flambe_next_dev
   pg_restore --list "$FLAMBE_BACKUP_DIR/flambe-next-pre-release.dump"
   ```

4. Run the release gates against a disposable database and the production
   bundle:

   ```sh
   cd backend_next
   mix precommit

   cd ../frontend
   nvm exec 22 npm run typecheck
   nvm exec 22 npm run test:unit
   nvm exec 22 npm run build
   nvm exec 22 npm run test:smoke
   ```

5. If a staging environment is introduced, verify local registration, login,
   logout, timeline rendering, a thread rename, activity begin/end/delete, and
   persisted thread collapse there. This project currently has local
   environments only.

## Deploy

1. Build the frontend with `nvm exec 22 npm run build`.
2. Run `mix ecto.migrate` from `backend_next` against the intended target.
3. Start Phoenix 1.8 and verify `GET /api/health` returns `{"status":"ok"}`.
4. Run the browser smoke suite against the deployed origin with
   `PLAYWRIGHT_BASE_URL=https://your-host nvm exec 22 npm run test:smoke`.

## Roll back

1. Stop the new application revision before restoring data.
2. Restore only to the confirmed release target, never the legacy source:

   ```sh
   pg_restore --clean --if-exists --exit-on-error \
     --dbname=flambe_next_dev \
     /absolute/path/flambe-next-pre-release.dump
   ```

3. Start the previous application revision and check `/api/health` and login.
4. Record the reason for rollback before attempting another release.

The retired Phoenix 1.3 source is available in Git history. Its database is not
a deployment target and remains usable as a read-only import source.
