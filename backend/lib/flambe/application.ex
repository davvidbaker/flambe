defmodule Flambe.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      FlambeWeb.Telemetry,
      Flambe.Repo,
      {DNSCluster, query: Application.get_env(:flambe, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: Flambe.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: Flambe.Finch},
      # Start a worker by calling: Flambe.Worker.start_link(arg)
      # {Flambe.Worker, arg},
      # Start to serve requests, typically the last entry
      FlambeWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Flambe.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    FlambeWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
