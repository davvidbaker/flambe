# Flambe

The Flambe timeline application lives in `frontend/packages/core` and is backed
by the Phoenix app in `backend`.

## Run locally

Requirements: Node 22 LTS, Elixir 1.18/OTP 27, and PostgreSQL.

1. Create local backend settings (adjust the PostgreSQL credentials if needed):

   ```sh
   cd backend
   cp config/dev.secret.example.exs config/dev.secret.exs
   mix deps.get
   mix ecto.create
   mix ecto.migrate
   mix phx.server
   ```

2. In another terminal, start the Vite development server:

   ```sh
   cd frontend
   npm ci --ignore-scripts
   npm run dev
   ```

Open http://localhost:5173, create an account, and you will be taken to its
default `Main` trace. Vite proxies API, authentication, and socket requests to
Phoenix at http://localhost:4000.

To build the Phoenix-served production frontend, run `npm run build`. This
produces hashed assets and a manifest in `backend/priv/static/assets`; Phoenix
serves the resulting SPA and its client-side routes at http://localhost:4000.

GitHub sign-in remains optional; configure `GITHUB_CLIENT_ID` and
`GITHUB_CLIENT_SECRET` in the shell that starts Phoenix to enable it.

## Local data safety

See [the local database workflow](docs/LOCAL_DATABASE.md) before backing up,
restoring, or resetting a database.
