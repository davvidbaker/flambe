import Config

database_port = String.to_integer(System.get_env("PGPORT") || "5432")

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
# Run `mix help test` for more information.
config :flambe_next, FlambeNext.Repo,
  username: System.get_env("PGUSER") || "postgres",
  password: System.get_env("PGPASSWORD") || "postgres",
  hostname: System.get_env("PGHOST") || "localhost",
  port: database_port,
  database:
    System.get_env("FLAMBE_NEXT_TEST_DATABASE") ||
      "flambe_next_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :flambe_next, FlambeNextWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "Z507SOlyKNdc0S15q9Suim4WQKZTYbXfJzb/2tDIJ72s/P3sRpu8yMDiK1q/aVBo",
  server: false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

# Sort query params output of verified routes for robust url comparisons
config :phoenix,
  sort_verified_routes_query_params: true

config :flambe_next, invite_code: System.get_env("FLAMBE_INVITE_CODE") || "test-invite"

config :flambe_next,
  share_store: FlambeNext.Shares.FakeStore,
  share_viewer_url: "https://share.test"
