use Mix.Config

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :flambe, FlambeWeb.Endpoint,
  http: [port: 4001],
  server: false

# for faster testing do less hashing
config :pbkdf2_elixir, :rounds, 1

# Test-only signing key. This lets focused authentication checks exercise the
# same token flow used by the frontend without depending on the ignored
# development secret file.
config :flambe, Flambe.Guardian,
  issuer: "flambe-test",
  secret_key: "e2be5f3708585d171c3174734341bf7c0a849e9a62fa4c08803d3dd7ca5e8d5c"

# Print only warnings and errors during test
config :logger, level: :warn

# Configure your database
config :flambe, Flambe.Repo,
  adapter: Ecto.Adapters.Postgres,
  username: "postgres",
  password: "postgres",
  database: "flambe_test",
  hostname: "localhost",
  pool: Ecto.Adapters.SQL.Sandbox
