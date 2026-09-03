defmodule FlambeNextWeb.AgentStatusStreamController do
  use FlambeNextWeb, :controller

  import Plug.Conn

  alias FlambeNext.AgentPresence

  def show(conn, _params) do
    user_id = conn.assigns.current_user.id
    :ok = AgentPresence.subscribe(user_id)

    conn =
      conn
      |> put_resp_content_type("text/event-stream")
      |> put_resp_header("cache-control", "no-cache")
      |> put_resp_header("connection", "keep-alive")
      |> send_chunked(:ok)

    with {:ok, conn} <- send_count(conn, AgentPresence.count(user_id)) do
      stream(conn, user_id)
    else
      {:error, _reason} -> conn
    end
  end

  defp stream(conn, user_id) do
    receive do
      {:agent_presence, ^user_id, count} ->
        case send_count(conn, count) do
          {:ok, conn} -> stream(conn, user_id)
          {:error, _reason} -> conn
        end
    after
      :timer.seconds(15) ->
        case chunk(conn, ": keep-alive\n\n") do
          {:ok, conn} -> stream(conn, user_id)
          {:error, _reason} -> conn
        end
    end
  end

  defp send_count(conn, count) do
    chunk(conn, "data: #{Jason.encode!(%{active_agents: count})}\n\n")
  end
end
