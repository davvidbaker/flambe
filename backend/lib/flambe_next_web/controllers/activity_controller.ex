defmodule FlambeNextWeb.ActivityController do
  use FlambeNextWeb, :controller

  alias FlambeNext.{Accounts, Reducer, ReducerAgent, Traces}
  alias FlambeNextWeb.EventStream

  # Agents (bearer token) propose a start and the reducer resolves parent, thread, and
  # categories (ADR-012); the SPA (session) writes exactly what it sent.
  def create(
        conn,
        %{"trace_id" => trace_id, "activity" => activity_attrs, "event" => event_attrs} = params
      ) do
    user = conn.assigns.current_user
    trace = Traces.get_user_trace!(user, trace_id)
    activity_attrs = agent_identity(conn, activity_attrs)

    result =
      if Map.has_key?(conn.assigns, :api_token) do
        Reducer.reduce_start(user, trace, %{
          "thread_id" => Map.get(params, "thread_id"),
          "activity" => activity_attrs,
          "event" => event_attrs,
          agent_id: Map.get(activity_attrs, "agent_id")
        })
      else
        direct_create(user, trace, params, activity_attrs, event_attrs)
      end

    case result do
      {:ok, %{activity: activity, event: event, notes: notes}} ->
        :ok = EventStream.broadcast_event(user, event)
        if notes && is_nil(activity.parent_id), do: ReducerAgent.place_root_async(user, activity)

        conn
        |> put_status(:created)
        |> render(:show, activity: activity, event: event, reducer: notes)

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

  defp direct_create(user, trace, %{"thread_id" => thread_id}, activity_attrs, event_attrs) do
    thread = Traces.get_user_trace_thread!(user, trace.id, thread_id)
    category_ids = Map.get(activity_attrs, "categories", [])

    with {:ok, parent} <-
           parent_activity(user, trace.id, thread.id, Map.get(activity_attrs, "parent_id")),
         {:ok, categories} <- Accounts.get_user_categories(user, category_ids),
         {:ok, activity, event} <-
           Traces.create_activity(trace, thread, parent, activity_attrs, event_attrs, categories) do
      {:ok, %{activity: activity, event: event, notes: nil}}
    end
  end

  defp direct_create(_user, _trace, _params, _activity_attrs, _event_attrs),
    do: {:error, :not_found}

  defp agent_identity(conn, activity_attrs) do
    attrs = Map.drop(activity_attrs, ["agent_id", "agent_name"])

    case conn.assigns[:agent] do
      %{id: agent_id, name: name} ->
        Map.merge(attrs, %{"agent_id" => agent_id, "agent_name" => name})

      nil ->
        attrs
    end
  end

  def update(conn, %{"id" => id, "activity" => attrs}) do
    user = conn.assigns.current_user
    activity = Traces.get_user_activity!(user, id)
    attrs = Map.drop(attrs, ["agent_id", "agent_name"])

    with {:ok, categories} <- update_categories(user, activity, attrs),
         {:ok, activity} <- maybe_move_thread(user, activity, attrs),
         {:ok, activity} <-
           Traces.update_activity(
             activity,
             Map.drop(attrs, ["thread_id", "category_ids", "move_child_ids"]),
             categories
           ) do
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

  defp maybe_move_thread(user, activity, attrs) do
    case Map.fetch(attrs, "thread_id") do
      :error ->
        {:ok, activity}

      {:ok, thread_id} ->
        move_child_ids =
          case Map.fetch(attrs, "move_child_ids") do
            :error -> :all
            {:ok, ids} when is_list(ids) -> ids
            {:ok, _} -> :invalid
          end

        if move_child_ids == :invalid do
          {:error, :not_found}
        else
          Traces.move_activity_subtree(user, activity, thread_id, move_child_ids)
        end
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
