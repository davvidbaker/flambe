defmodule FlambeNextWeb.ActivityController do
  use FlambeNextWeb, :controller

  alias FlambeNext.{Accounts, Traces}
  alias FlambeNextWeb.EventStream

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

    with {:ok, parent} <-
           parent_activity(user, trace.id, thread.id, Map.get(activity_attrs, "parent_id")),
         {:ok, categories} <- Accounts.get_user_categories(user, category_ids),
         {:ok, activity, event} <-
           Traces.create_activity(trace, thread, parent, activity_attrs, event_attrs, categories) do
      :ok = EventStream.broadcast_event(user, event)

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

  def update(conn, %{"id" => id, "activity" => attrs}) do
    user = conn.assigns.current_user
    activity = Traces.get_user_activity!(user, id)

    with {:ok, categories} <- update_categories(user, activity, attrs),
         {:ok, activity} <- Traces.update_activity(activity, attrs, categories) do
      render(conn, :show, activity: activity)
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

  def show(conn, %{"id" => id}) do
    render(conn, :show, activity: Traces.get_user_activity!(conn.assigns.current_user, id))
  end

  def delete(conn, %{"id" => id}) do
    activity = Traces.get_user_activity!(conn.assigns.current_user, id)
    {:ok, _activity} = Traces.delete_activity(activity)
    send_resp(conn, :no_content, "")
  end

  defp update_categories(user, activity, attrs) do
    case Map.fetch(attrs, "category_ids") do
      {:ok, category_ids} -> Accounts.get_user_categories(user, category_ids)
      :error -> {:ok, activity.categories}
    end
  end

  defp parent_activity(_user, _trace_id, _thread_id, nil), do: {:ok, nil}

  defp parent_activity(user, trace_id, thread_id, parent_id) when is_binary(parent_id) do
    case Integer.parse(parent_id) do
      {id, ""} -> parent_activity(user, trace_id, thread_id, id)
      _ -> {:error, :not_found}
    end
  end

  defp parent_activity(user, trace_id, thread_id, parent_id)
       when is_integer(parent_id) and parent_id > 0 do
    case Traces.get_user_trace_thread_activity(user, trace_id, thread_id, parent_id) do
      nil -> {:error, :not_found}
      parent -> {:ok, parent}
    end
  end

  defp parent_activity(_user, _trace_id, _thread_id, _parent_id), do: {:error, :not_found}

  defp errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, _options} -> message end)
  end
end
