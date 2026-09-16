defmodule FlambeNextWeb.AgentCommandController do
  use FlambeNextWeb, :controller

  alias FlambeNext.AgentCommands

  @commands ~w(start end suspend resume status message)

  def index(conn, _params), do: json(conn, %{data: %{version: 1, commands: @commands}})

  def create(conn, %{"command" => command, "arguments" => arguments})
      when command in @commands and is_map(arguments) do
    arguments = put_agent_identity(conn, arguments)

    case AgentCommands.execute(conn.assigns.current_user, command, arguments) do
      {:ok, result} -> json(conn, %{data: result})
      {:error, reason} -> render_error(conn, reason)
    end
  end

  def create(conn, _params),
    do: render_error(conn, {:invalid_input, "command and arguments are required"})

  def put_agent_identity(%{assigns: %{agent: agent}} = conn, arguments) do
    arguments =
      arguments
      |> Map.put("agent_id", agent.id)
      |> Map.put("agent_name", agent.name)

    case get_req_header(conn, "x-flambe-agent-platform") do
      [_platform] -> Map.put(arguments, "platform", agent.platform)
      _ -> arguments
    end
  end

  def put_agent_identity(_conn, arguments), do: arguments

  def render_error(conn, :not_found) do
    conn
    |> put_status(:not_found)
    |> json(%{error: %{code: "NOT_FOUND", message: "The requested resource was not found"}})
  end

  def render_error(conn, {:invalid_input, message}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: %{code: "INVALID_INPUT", message: message}})
  end

  def render_error(conn, {:open_children, children}) do
    conn
    |> put_status(:conflict)
    |> json(%{
      error: %{
        code: "OPEN_CHILDREN",
        message: "The activity has open children. End descendants first or use force: true",
        open_children: children
      }
    })
  end

  def render_error(conn, :reducer_not_configured) do
    conn
    |> put_status(:service_unavailable)
    |> json(%{
      error: %{code: "REDUCER_NOT_CONFIGURED", message: "The Reducer Agent is not configured"}
    })
  end

  def render_error(conn, _reason) do
    conn
    |> put_status(:bad_gateway)
    |> json(%{error: %{code: "COMMAND_FAILED", message: "The agent command failed"}})
  end
end
