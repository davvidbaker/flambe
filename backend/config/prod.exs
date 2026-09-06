import Config

# Match the public URL scheme. Fly builds default to https; MIX_ENV=prod CI sets
# PHX_URL_SCHEME=http for localhost, and WebKit will not store Secure cookies on HTTP.
config :flambe_next,
  session_cookie_secure: System.get_env("PHX_URL_SCHEME", "https") != "http"

# Force using SSL in production. This also sets the "strict-security-transport" header,
# known as HSTS. If you have a health check endpoint, you may want to exclude it below.
# Note `:force_ssl` is required to be set at compile-time.
config :flambe_next, FlambeNextWeb.Endpoint,
  force_ssl: [
    rewrite_on: [:x_forwarded_proto],
    exclude: [
      paths: ["/api/health"],
      hosts: ["localhost", "127.0.0.1"]
    ]
  ]

# Do not print debug messages in production
config :logger, level: :info

# Runtime production configuration, including reading
# of environment variables, is done on config/runtime.exs.
