use Mix.Config

config :flambe, FlambeWeb.Endpoint,
  http: [port: 4000, ip: {0, 0, 0, 0, 0, 0, 0, 1}],
  server: true

config :flambe, Flambe.Repo,
  adapter: Ecto.Adapters.Postgres,
  username: System.get_env("POSTGRES_USER") || "postgres",
  password: System.get_env("POSTGRES_PASSWORD") || "postgres",
  database: System.get_env("POSTGRES_DB") || "flambe_ci",
  hostname: System.get_env("POSTGRES_HOST") || "localhost",
  pool_size: 10

config :flambe, Flambe.Guardian,
  issuer: "flambe-ci",
  secret_key: "29fc9a9f2b581cbdcab4fd5648e6f681166ee1a50734f8f00b993ee99e1729cf"

config :flambe, frontend_url: "http://localhost:8081"
config :logger, level: :warn
