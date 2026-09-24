defmodule FlambeNextWeb.EventController do
  use FlambeNextWeb, :controller

  alias FlambeNext.{AgentCommands, Reducer, Traces}
  alias FlambeNextWeb.EventStream

  def create(conn, %{"trace_id" => trace_id, "activity_id" => activity_id, "event" => attrs}) do
    user = conn.assigns.current_user
    trace = Traces.get_user_trace!(user, trace_id)
    activity = Traces.get_user_trace_activity!(user, trace.id, activity_id)

    case record_event(conn, trace, activity, attrs) do
      {:ok, %{event: event, closed_descendants: closed} = recorded} ->
        unless recorded[:already_broadcast] do
          Enum.each(Enum.map(closed, & &1.event) ++ [event], fn written ->
            :ok = EventStream.broadcast_event(user, written)
          end)
        end

        conn
        |> put_status(:created)
        |> render(:show, event: event, closed_descendants: closed)

      {:error, :parent_unstarted} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: %{activity: ["parent is unstarted"]}})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: errors(changeset)})
    end
  end

  def update(conn, %{"id" => id, "event" => attrs}) do
    user = conn.assigns.current_user
    event = Traces.get_user_event!(user, id)

    case Traces.update_event(event, attrs) do
      {:ok, event} ->
        :ok = EventStream.broadcast_event(user, event)
        render(conn, :show, event: event)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: errors(changeset)})
    end
  end

  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    event = Traces.get_user_event!(user, id)

    case Traces.delete_event(event) do
      {:ok, _event} ->
        :ok = EventStream.broadcast_event_deleted(user, event)
        send_resp(conn, :no_content, "")

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: errors(changeset)})
    end
  end

  # Agents (bearer token) propose transitions and the reducer folds them into the stack
  # (ADR-011). Humans editing from the SPA (session) write directly.
  # Lifecycle phases go through the shared command service. Other phases stay a
  # direct reduction: there is no agent command for them, and agents do not post them.
  defp record_event(conn, trace, activity, attrs) do
    if Map.has_key?(conn.assigns, :api_token) do
      agent_event(conn, trace, activity, attrs)
    else
      with {:ok, event} <- Traces.create_event(trace, activity, attrs) do
        {:ok, %{event: event, closed_descendants: []}}
      end
    end
  end

  defp agent_event(conn, trace, activity, attrs) do
    command = lifecycle_command(phase(attrs))
    timestamp = timestamp_integer(attrs)

    if is_binary(command) and is_integer(timestamp) do
      user = conn.assigns.current_user

      case AgentCommands.execute(user, command, event_command_attrs(conn, trace, activity, attrs)) do
        {:ok, result} ->
          {:ok,
           %{
             event: Traces.get_user_event!(user, result.event_id),
             closed_descendants: hydrate_closed(user, result.closed_descendants),
             already_broadcast: true
           }}

        {:error, %Ecto.Changeset{} = changeset} ->
          {:error, changeset}

        {:error, {:invalid_input, _message}} ->
          Reducer.reduce_event(trace, activity, attrs)
      end
    else
      Reducer.reduce_event(trace, activity, attrs)
    end
  end

  defp event_command_attrs(conn, trace, activity, attrs) do
    command_attrs = %{
      "trace_id" => trace.id,
      "activity_id" => activity.id,
      "timestamp" => timestamp_integer(attrs),
      # The legacy REST path has no force flag. Ending a parent always closed
      # open descendants (ADR-011); keep that by treating the proposal as forced.
      "force" => true
    }

    command_attrs =
      case Map.get(attrs, "message") || Map.get(attrs, :message) do
        message when is_binary(message) -> Map.put(command_attrs, "message", message)
        _ -> command_attrs
      end

    command_attrs =
      case phase(attrs) do
        phase when is_binary(phase) -> Map.put(command_attrs, "phase", phase)
        _ -> command_attrs
      end

    case conn.assigns[:agent] do
      %{id: agent_id, name: name} = agent ->
        command_attrs
        |> Map.put("agent_id", agent_id)
        |> Map.put("agent_name", name)
        |> Map.put("agent_platform", Map.get(agent, :platform))

      _ ->
        command_attrs
    end
  end

  defp hydrate_closed(user, closed) do
    Enum.map(closed, fn item ->
      %{
        activity: Traces.get_user_activity!(user, item.activity_id),
        event: Traces.get_user_event!(user, item.event_id)
      }
    end)
  end

  defp lifecycle_command(phase) when phase in ~w(E J V), do: "end"
  defp lifecycle_command("S"), do: "suspend"
  defp lifecycle_command("R"), do: "resume"
  defp lifecycle_command(_phase), do: nil

  defp phase(attrs), do: Map.get(attrs, "phase") || Map.get(attrs, :phase)

  defp timestamp_integer(attrs) do
    Map.get(attrs, "timestamp_integer") || Map.get(attrs, :timestamp_integer)
  end

  defp errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, _options} -> message end)
  end
end
