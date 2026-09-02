defmodule FlambeNext.Application do
  # See https://elixir.hexdocs.pm/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      FlambeNextWeb.Telemetry,
      FlambeNext.Repo,
      {DNSCluster, query: Application.get_env(:flambe_next, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: FlambeNext.PubSub},
      FlambeNext.AgentPresence,
      # Start a worker by calling: FlambeNext.Worker.start_link(arg)
      # {FlambeNext.Worker, arg},
      # Start to serve requests, typically the last entry
      FlambeNextWeb.Endpoint
    ]

    # See https://elixir.hexdocs.pm/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: FlambeNext.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    FlambeNextWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
