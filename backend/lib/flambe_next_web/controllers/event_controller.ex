defmodule FlambeNextWeb.EventController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Traces

  def create(conn, %{"trace_id" => trace_id, "activity_id" => activity_id, "event" => attrs}) do
    user = conn.assigns.current_user
    trace = Traces.get_user_trace!(user, trace_id)
    activity = Traces.get_user_trace_activity!(user, trace.id, activity_id)

    case Traces.create_event(trace, activity, attrs) do
      {:ok, event} ->
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
    event = Traces.get_user_event!(conn.assigns.current_user, id)

    case Traces.update_event(event, attrs) do
      {:ok, event} ->
        render(conn, :show, event: event)

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
