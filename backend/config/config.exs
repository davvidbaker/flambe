# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.
use Mix.Config

# General application configuration
config :steady, ecto_repos: [Steady.Repo]

# Configures the endpoint
config :steady, SteadyWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "blTEMHWIkbiAPhmJWziLsANDEZMRLYl0OCK3BBydt1IVNRR3pk9qo7GojiF6zbbq",
  render_errors: [view: SteadyWeb.ErrorView, accepts: ~w(html json)],
  pubsub: [name: Steady.PubSub, adapter: Phoenix.PubSub.PG2]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :ueberauth, Ueberauth,
  providers: [
    # facebook: { Ueberauth.Strategy.Facebook, [ opt1: "value", opts2: "value" ]},
    github: {Ueberauth.Strategy.Github, []}
  ]

config :steady, Steady.AuthPipeline,
  module: Steady.Guardian,
  error_handler: Steady.AuthErrorHandler

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
