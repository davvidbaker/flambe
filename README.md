# Flambe

The original Flambe timeline application lives in `frontend/packages/core` and
is backed by the Phoenix app in `backend`.

## Run locally

Requirements: Node 18, Elixir 1.18/OTP 27, and PostgreSQL.

1. Create local backend settings (adjust the PostgreSQL credentials if needed):

   ```sh
   cd backend
   cp config/dev.secret.example.exs config/dev.secret.exs
   mix deps.get
   mix ecto.create
   mix ecto.migrate
   mix phx.server
   ```

2. In another terminal, start the original React app:

   ```sh
   cd frontend
   npm ci --ignore-scripts
   NODE_OPTIONS=--openssl-legacy-provider npm run bootstrap -- --ignore-scripts
   NODE_OPTIONS=--openssl-legacy-provider npm run start
   ```

Open http://localhost:8081, create an account, and you will be taken to its
default `Main` trace. The API runs at http://localhost:4000.

GitHub sign-in remains optional; configure `GITHUB_CLIENT_ID` and
`GITHUB_CLIENT_SECRET` in the shell that starts Phoenix to enable it.
