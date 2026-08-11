# Flambe Phoenix 1.8 backend

This is Flambe's active API, authentication, realtime, and production-SPA
server. It uses the isolated `flambe_next_*` PostgreSQL databases and listens
on [localhost:4001](http://localhost:4001) in development.

```sh
mix setup
mix phx.server
```

Build the frontend from `../frontend` with `nvm exec 22 npm run build`; Phoenix
then serves the SPA, API, and WebSocket endpoint from one origin.

Run `mix precommit` before committing backend changes. See
[MIGRATION.md](MIGRATION.md) for safely importing restored legacy data into the
isolated database.
