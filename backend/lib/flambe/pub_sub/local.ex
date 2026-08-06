defmodule Flambe.PubSub.Local do
  @moduledoc false

  use Supervisor

  # Phoenix 1.3's bundled PG2 adapter depends on Erlang's :pg2 module, which
  # was removed in OTP 24. Flambe is run as a single local node in development,
  # so the original local dispatcher provides the required channel semantics
  # without that obsolete distributed-process dependency.
  def child_spec(opts) when is_list(opts) do
    %{id: __MODULE__, start: {__MODULE__, :start_link, [opts]}, type: :supervisor}
  end

  def start_link(opts) do
    server = Keyword.fetch!(opts, :name)
    start_link(server, opts)
  end

  def start_link(server, opts) do
    Supervisor.start_link(__MODULE__, {server, opts}, name: Module.concat(server, Supervisor))
  end

  def init({server, opts}) do
    pool_size = Keyword.get(opts, :pool_size, :erlang.system_info(:schedulers))

    dispatch_rules = [
      {:broadcast, __MODULE__, [opts[:fastlane], server, pool_size]},
      {:direct_broadcast, __MODULE__, [opts[:fastlane], server, pool_size]},
      {:node_name, __MODULE__, [opts[:node_name]]}
    ]

    children = [
      supervisor(Phoenix.PubSub.LocalSupervisor, [server, pool_size, dispatch_rules])
    ]

    supervise(children, strategy: :one_for_one)
  end

  def broadcast(fastlane, server, pool_size, from_pid, topic, message) do
    Phoenix.PubSub.Local.broadcast(fastlane, server, pool_size, from_pid, topic, message)
    :ok
  end

  def direct_broadcast(fastlane, server, pool_size, _node_name, from_pid, topic, message) do
    broadcast(fastlane, server, pool_size, from_pid, topic, message)
  end

  def node_name(nil), do: node()
  def node_name(name), do: name
end
