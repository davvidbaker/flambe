defmodule FlambeNextWeb.EventController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Traces
  alias FlambeNextWeb.EventStream

  def create(conn, %{"trace_id" => trace_id, "activity_id" => activity_id, "event" => attrs}) do
    user = conn.assigns.current_user
    trace = Traces.get_user_trace!(user, trace_id)
    activity = Traces.get_user_trace_activity!(user, trace.id, activity_id)

    case Traces.create_event(trace, activity, attrs) do
      {:ok, event} ->
        :ok = EventStream.broadcast_event(user, event)

        conn
        |> put_status(:created)
        |> render(:show, event: event)

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

  defp errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, _options} -> message end)
  end
end
