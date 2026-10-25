defmodule FlambeNextWeb.AgentMessageController do
  use FlambeNextWeb, :controller

  alias FlambeNext.{AgentCommands, Agents, Traces}
  alias FlambeNextWeb.AgentCommandController

  def index(conn, %{"agent_id" => agent_id}) do
    messages =
      conn.assigns.current_user
      |> Agents.list_messages(agent_id)
      |> Enum.map(&AgentCommands.message_json/1)

    json(conn, %{data: messages})
  end

  def create(conn, %{"agent_id" => agent_id, "body" => body} = params) when is_binary(body) do
    user = conn.assigns.current_user

    with {:ok, trace_id} <- trace_id(user, params["trace_id"]),
         {:ok, message} <- Agents.send_message(user, agent_id, trace_id, body) do
      conn
      |> put_status(:created)
      |> json(%{data: AgentCommands.message_json(message)})
    else
      {:error, %Ecto.Changeset{}} ->
        AgentCommandController.render_error(
          conn,
          {:invalid_input, "body must be 1 to 4000 bytes"}
        )

      {:error, reason} ->
        AgentCommandController.render_error(conn, reason)
    end
  end

  def create(conn, _params),
    do: AgentCommandController.render_error(conn, {:invalid_input, "body is required"})

  defp trace_id(_user, nil), do: {:ok, nil}

  defp trace_id(user, id) do
    {:ok, Traces.get_user_trace!(user, id).id}
  rescue
    Ecto.NoResultsError -> {:error, :not_found}
    Ecto.Query.CastError -> {:error, {:invalid_input, "trace_id must be an id"}}
  end
end
