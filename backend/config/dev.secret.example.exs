use Mix.Config

# Copy this file to dev.secret.exs and adjust for your local PostgreSQL setup.
config :flambe, Flambe.Repo,
  adapter: Ecto.Adapters.Postgres,
  username: "postgres",
  password: "postgres",
  database: "flambe_legacy_dev",
  hostname: "localhost",
  pool_size: 10

# Generate a different value for a shared environment.
config :flambe, Flambe.Guardian,
  issuer: "flambe",
  secret_key: "7e0d99fdf1321c39f011a6d5e31c1a4cb651720fd825c3c3664a697e90b255ec"

# Email/password login works without these. They enable GitHub OAuth.
config :ueberauth, Ueberauth.Strategy.Github.OAuth,
  client_id: System.get_env("GITHUB_CLIENT_ID") || "local-development",
  client_secret: System.get_env("GITHUB_CLIENT_SECRET") || "local-development"
