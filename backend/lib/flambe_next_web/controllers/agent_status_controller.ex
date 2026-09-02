defmodule FlambeNextWeb.AgentStatusController do
  use FlambeNextWeb, :controller

  alias FlambeNext.AgentPresence

  def show(conn, _params) do
    json(conn, %{active_agents: AgentPresence.count(conn.assigns.current_user.id)})
  end
end
