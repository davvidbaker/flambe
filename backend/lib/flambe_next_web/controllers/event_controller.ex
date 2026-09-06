defmodule FlambeNextWeb.EventController do
  use FlambeNextWeb, :controller

  alias FlambeNext.{Reducer, Traces}
  alias FlambeNextWeb.EventStream

  def create(conn, %{"trace_id" => trace_id, "activity_id" => activity_id, "event" => attrs}) do
    user = conn.assigns.current_user
    trace = Traces.get_user_trace!(user, trace_id)
    activity = Traces.get_user_trace_activity!(user, trace.id, activity_id)

    case record_event(conn, trace, activity, attrs) do
      {:ok, %{event: event, closed_descendants: closed}} ->
        Enum.each(Enum.map(closed, & &1.event) ++ [event], fn written ->
          :ok = EventStream.broadcast_event(user, written)
        end)

        conn
        |> put_status(:created)
        |> render(:show, event: event, closed_descendants: closed)

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
  defp record_event(conn, trace, activity, attrs) do
    if Map.has_key?(conn.assigns, :api_token) do
      Reducer.reduce_event(trace, activity, attrs)
    else
      with {:ok, event} <- Traces.create_event(trace, activity, attrs) do
        {:ok, %{event: event, closed_descendants: []}}
      end
    end
  end

  defp errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, _options} -> message end)
  end
end
