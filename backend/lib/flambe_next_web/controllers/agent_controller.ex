defmodule FlambeNextWeb.AgentController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Agents

  def index(conn, _params) do
    agents =
      conn.assigns.current_user
      |> Agents.list()
      |> Enum.map(fn agent ->
        %{
          agent_id: agent.agent_id,
          name: agent.name,
          platform: agent.platform,
          last_seen_at: agent.last_seen_at
        }
      end)

    json(conn, %{data: agents})
  end

  @doc "Who the calling agent is, as the reducer sees it."
  def me(conn, _params) do
    case conn.assigns[:agent] do
      %{id: id, name: name, platform: platform, assigned?: assigned?} ->
        json(conn, %{
          data: %{agent_id: id, name: name, platform: platform, name_assigned: assigned?}
        })

      nil ->
        conn
        |> put_status(:bad_request)
        |> json(%{
          error: "AGENT_ID_REQUIRED",
          detail: "Send x-flambe-agent-id with a bearer token"
        })
    end
  end
end
