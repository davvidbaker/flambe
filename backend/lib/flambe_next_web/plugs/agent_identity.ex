defmodule FlambeNextWeb.Plugs.AgentIdentity do
  @moduledoc """
  Resolves the calling agent for authenticated requests that carry `x-flambe-agent-id`
  (ADR-012). Assigns `conn.assigns.agent` and answers with `x-flambe-agent-name`, plus
  `x-flambe-agent-name-assigned: true` on the request that coined the name.
  `x-flambe-agent-platform` (e.g. "Cursor Cloud") is recorded when present.
  """

  import Plug.Conn

  alias FlambeNext.Agents

  def init(options), do: options

  def call(conn, _options) do
    with [agent_id] when byte_size(agent_id) in 1..200 <-
           get_req_header(conn, "x-flambe-agent-id"),
         {:ok, %{agent: agent, assigned?: assigned?}} <-
           Agents.identify(
             conn.assigns.current_user,
             agent_id,
             header(conn, "x-flambe-agent-name"),
             header(conn, "x-flambe-agent-platform")
           ) do
      conn
      |> assign(:agent, %{
        id: agent.agent_id,
        name: agent.name,
        platform: agent.platform,
        assigned?: assigned?
      })
      |> put_resp_header("x-flambe-agent-name", agent.name)
      |> maybe_put_assigned(assigned?)
    else
      _ -> conn
    end
  end

  defp header(conn, name) do
    case get_req_header(conn, name) do
      [value] -> value
      _ -> nil
    end
  end

  defp maybe_put_assigned(conn, true),
    do: put_resp_header(conn, "x-flambe-agent-name-assigned", "true")

  defp maybe_put_assigned(conn, false), do: conn
end
