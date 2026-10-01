defmodule FlambeNext.AgentCommandIdentity do
  @moduledoc """
  Applies authenticated agent identity to agent-command arguments.

  Identity resolved by the HTTP pipeline is authoritative over values supplied
  in a request body. Callers without resolved identity retain explicit argument
  values for compatibility with direct MCP clients.
  """

  import Plug.Conn, only: [get_req_header: 2]

  def from_conn(%{assigns: %{agent: agent}} = conn, arguments) do
    platform? = match?([_platform], get_req_header(conn, "x-flambe-agent-platform"))
    merge(arguments, agent, platform?)
  end

  def from_conn(_conn, arguments), do: arguments

  def merge(arguments, nil, _platform?), do: arguments

  def merge(arguments, agent, platform?) do
    arguments =
      arguments
      |> Map.put("agent_id", agent.id)
      |> Map.put("agent_name", agent.name)

    if platform?, do: Map.put(arguments, "platform", agent.platform), else: arguments
  end
end
