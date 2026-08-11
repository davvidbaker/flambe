# Phoenix 1.8 migration foundation

`backend_next/` is the side-by-side Phoenix 1.8 application for the backend
migration. It is intentionally separate from `backend/` and is not yet used by
the React app.

- Application name: `flambe_next`
- Development port: `4001` (the legacy app remains on `4000`)
- Development database: `flambe_next_dev`
- Test database: `flambe_next_test`
- Health check: `GET /api/health`

The restored Flambe database must remain attached to the legacy application
until each schema, API response, authentication behavior, and Channel contract
has been deliberately migrated and tested. Do not point `FlambeNext.Repo` at
the restored database as a shortcut.

Next migration steps:

1. Capture legacy API and Channel contracts as fixtures.
2. Port the data schemas and contexts with explicit Ecto migrations.
3. Port authentication and one API resource at a time.
4. Switch the frontend proxy only after each resource has equivalent contract
   and browser coverage.

## Completed first slice

The new database has `users`, `traces`, and `threads` migrations. Creating a
trace automatically creates its `Main` thread, matching the legacy behavior.
`FlambeNextWeb.TraceJSON` is checked against the frozen empty-trace response
fixture.

Local password authentication is available at `POST /auth/identity/callback`.
It returns the legacy frontend response shape and stores the signed-in user in
the Phoenix session. `GET /api/traces/:id` is protected by that session and
only returns traces owned by the current user. Existing users are still not
imported: the restored database remains exclusively attached to `backend/`
until an explicit credential-preserving import is implemented.
