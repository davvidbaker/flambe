defmodule FlambeNextWeb.AgentController do
  use FlambeNextWeb, :controller

  @doc "Who the calling agent is, as the reducer sees it."
  def me(conn, _params) do
    case conn.assigns[:agent] do
      %{id: id, name: name, assigned?: assigned?} ->
        json(conn, %{data: %{agent_id: id, name: name, name_assigned: assigned?}})

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
