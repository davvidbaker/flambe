defmodule FlambeNextWeb.ActivityController do
  use FlambeNextWeb, :controller

  alias FlambeNext.{Accounts, Traces}

  def create(conn, %{
        "trace_id" => trace_id,
        "thread_id" => thread_id,
        "activity" => activity_attrs,
        "event" => event_attrs
      }) do
    user = conn.assigns.current_user
    trace = Traces.get_user_trace!(user, trace_id)
    thread = Traces.get_user_trace_thread!(user, trace.id, thread_id)
    category_ids = Map.get(activity_attrs, "categories", [])

    with {:ok, categories} <- Accounts.get_user_categories(user, category_ids),
         {:ok, activity, event} <-
           Traces.create_activity(trace, thread, activity_attrs, event_attrs, categories) do
      conn
      |> put_status(:created)
      |> render(:show, activity: activity, event: event)
    else
      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "NOT_FOUND"})

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
