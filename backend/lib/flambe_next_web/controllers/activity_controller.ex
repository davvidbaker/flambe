defmodule FlambeNextWeb.ActivityController do
  use FlambeNextWeb, :controller

  alias FlambeNext.{Accounts, AgentCommands, Traces}
  alias FlambeNextWeb.EventStream

  # Agents (bearer token) propose a start and the reducer resolves parent, thread, and
  # categories (ADR-012); the SPA (session) writes exactly what it sent.
  def create(
        conn,
        %{"trace_id" => trace_id, "activity" => activity_attrs, "event" => event_attrs} = params
      ) do
    user = conn.assigns.current_user
    trace = Traces.get_user_trace!(user, trace_id)

    if Map.has_key?(conn.assigns, :api_token) do
      agent_create(conn, user, params, activity_attrs, event_attrs)
    else
      activity_attrs = agent_identity(conn, activity_attrs)

      case direct_create(user, trace, params, activity_attrs, event_attrs) do
        {:ok, %{activity: activity, event: event, notes: notes}} ->
          :ok = EventStream.broadcast_event(user, event)

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
  end

  defp agent_create(conn, user, params, activity_attrs, event_attrs) do
    case AgentCommands.execute(
           user,
           "start",
           start_command_attrs(conn, params, activity_attrs, event_attrs)
         ) do
      {:ok, result} ->
        activity = Traces.get_user_trace_activity!(user, params["trace_id"], result.activity_id)
        event = Traces.get_user_event!(user, result.event_id)

        conn
        |> put_status(:created)
        |> render(:show, activity: activity, event: event, reducer: Map.get(result, :reducer))

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "NOT_FOUND"})

      {:error, {:invalid_input, message}} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: %{activity: [message]}})

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: errors(changeset)})
    end
  end

  defp start_command_attrs(conn, params, activity_attrs, event_attrs) do
    attrs = %{
      "trace_id" => params["trace_id"],
      "name" => Map.get(activity_attrs, "name"),
      "category_ids" => Map.get(activity_attrs, "categories", []),
      "timestamp" => Map.get(event_attrs, "timestamp_integer")
    }

    attrs =
      case Map.get(params, "thread_id") do
        nil -> attrs
        thread_id -> Map.put(attrs, "thread_id", thread_id)
      end

    attrs =
      case Map.fetch(activity_attrs, "parent_id") do
        :error -> attrs
        {:ok, parent_id} -> Map.put(attrs, "parent_id", parent_id)
      end

    attrs =
      case Map.get(activity_attrs, "description") do
        description when is_binary(description) -> Map.put(attrs, "description", description)
        _ -> attrs
      end

    case conn.assigns[:agent] do
      %{id: agent_id, name: name} = agent ->
        attrs
        |> Map.put("agent_id", agent_id)
        |> Map.put("agent_name", name)
        |> Map.put("agent_platform", Map.get(agent, :platform))

      _ ->
        attrs
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
    attrs = maybe_drop_agent_identity(conn, attrs)

    with {:ok, attrs} <- apply_agent_assignment(user, attrs),
         {:ok, categories} <- update_categories(user, activity, attrs),
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

  # Agents may not reassign identity through the activity body. The SPA (session)
  # can, so a human can correct who owns a block.
  defp maybe_drop_agent_identity(conn, attrs) do
    if Map.has_key?(conn.assigns, :api_token) do
      Map.drop(attrs, ["agent_id", "agent_name"])
    else
      attrs
    end
  end

  defp apply_agent_assignment(user, attrs) do
    case fetch_attr(attrs, "agent_id") do
      :error ->
        {:ok, drop_attr(attrs, "agent_name")}

      {:ok, value} when value in [nil, ""] ->
        {:ok, attrs |> Map.put("agent_id", nil) |> Map.put("agent_name", nil)}

      {:ok, agent_id} when is_binary(agent_id) ->
        name =
          case known_agent(user, agent_id) do
            {:ok, _id, name} -> name
            :error -> supplied_agent_name(attrs, agent_id)
          end

        {:ok, attrs |> Map.put("agent_id", agent_id) |> Map.put("agent_name", name)}

      {:ok, _} ->
        {:error, :not_found}
    end
  end

  defp fetch_attr(attrs, key) do
    case Map.fetch(attrs, key) do
      :error -> Map.fetch(attrs, String.to_existing_atom(key))
      other -> other
    end
  rescue
    ArgumentError -> :error
  end

  defp drop_attr(attrs, key) do
    attrs |> Map.delete(key) |> Map.delete(String.to_existing_atom(key))
  rescue
    ArgumentError -> Map.delete(attrs, key)
  end

  defp supplied_agent_name(attrs, agent_id) do
    case fetch_attr(attrs, "agent_name") do
      {:ok, name} when is_binary(name) and name != "" -> name
      _ -> agent_id
    end
  end

  defp known_agent(user, agent_id) do
    case FlambeNext.Agents.get(user, agent_id) do
      %{agent_id: id, name: name} ->
        {:ok, id, name}

      nil ->
        case Traces.activity_agent_snapshot(user, agent_id) do
          {id, name} -> {:ok, id, name}
          nil -> :error
        end
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
