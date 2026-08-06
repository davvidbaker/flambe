defmodule Flambe.Mixfile do
  use Mix.Project

  def project do
    [
      app: :flambe,
      version: "0.0.1",
      elixir: "~> 1.4",
      elixirc_paths: elixirc_paths(Mix.env()),
      compilers: [:phoenix, :gettext] ++ Mix.compilers(),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps()
    ]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [
      mod: {Flambe.Application, []},
      extra_applications: [
        :logger,
        :runtime_tools,
        :ueberauth,
        :ueberauth_github,
        :ueberauth_identity
      ]
    ]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      {:cors_plug, "~> 1.5"},
      # Hackney 1.11 pins a certificate bundle that no longer builds with
      # modern Erlang. Its public API remains compatible with this newer
      # bundle.
      {:certifi, "~> 2.17", override: true},
      {:cowboy, "~> 1.0"},
      {:ex_doc, "~> 0.13"},
      {:gettext, "~> 0.11"},
      {:plug, "~> 1.20", override: true},
      # Guardian 1.x conditionally omits its Plug integration when compiled by
      # current Mix. Guardian 2 retains this API and supports current OTP.
      {:guardian, "~> 2.3"},
      # Guardian 1.x permits newer JOSE releases. The original 1.8 version
      # uses the removed :crypto.hmac/3 API on current OTP.
      {:jose, "~> 1.11", override: true},
      {:phoenix, "~> 1.3.4"},
      {:phoenix_pubsub, "~> 1.0"},
      {:phoenix_ecto, "~> 3.2"},
      # 2.10's template engine cannot run on current EEx; 2.14 retains the
      # Phoenix 1.x API while supporting newer Elixir releases.
      {:phoenix_html, "~> 2.14.0", override: true},
      {:phoenix_live_reload, "~> 1.0", only: :dev},
      {:postgrex, ">= 0.0.0"},
      {:ueberauth, "~> 0.10", override: true},
      {:ueberauth_github, "~> 0.6"},
      # The historical 0.2 release no longer compiles on current Elixir.
      # This is the maintained version of the same identity strategy.
      {:ueberauth_identity,
       github: "ueberauth/ueberauth_identity",
       ref: "abe0c28e205dc4c70a9a71d5a78f6f4ffba5739b",
       override: true},
      {:comeonin, "~> 4.1"},
      {:pbkdf2_elixir, "~> 0.12"},
      {:bcrypt_elixir, "~> 1.0"},
      {:plug_cowboy, "~> 1.0"}
    ]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to create, migrate and run the seeds file at once:
  #
  #     $ mix ecto.setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    [
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      test: ["ecto.create --quiet", "ecto.migrate", "test"]
    ]
  end
end
