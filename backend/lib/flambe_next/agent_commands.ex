defmodule FlambeNext.AgentCommands do
  @moduledoc """
  Shared application service for commands issued by coding agents.

  HTTP, MCP, and future adapters call this module so authorization, stack inference,
  lifecycle rules, broadcasts, and response state stay consistent.
  """

  import Ecto.Query

  alias FlambeNext.Accounts
  alias FlambeNext.Accounts.User
  alias FlambeNext.{AgentTransitions, Agents, Reducer, ReducerAgent, Repo, Traces}
  alias FlambeNext.Traces.{Activity, Event}
  alias FlambeNextWeb.EventStream

  @commands ~w(start end suspend resume status message)
  @open_phases ~w(B R X)
  @lifecycle_phases ~w(B R X S E J V)

  def execute(%User{} = user, command, attrs)
      when command in @commands and is_map(attrs) do
    with {:ok, trace_id} <- positive_id(attrs["trace_id"], "trace_id"),
         {:ok, trace} <- authorized_trace(user, trace_id) do
      run(user, trace, command, attrs)
    end
  end

  def execute(%User{}, command, _attrs) when is_binary(command),
    do: {:error, {:invalid_input, "unknown command: #{command}"}}

  def execute(%User{}, _command, _attrs),
    do: {:error, {:invalid_input, "command and arguments must be valid"}}

  defp run(user, trace, "start", attrs) do
    with {:ok, name} <- required_string(attrs["name"], "name"),
         {:ok, thread} <- selected_thread(user, trace, attrs["thread_id"]),
         {:ok, parent} <- selected_parent(user, trace, thread, attrs),
         {:ok, category_ids} <- id_list(attrs["category_ids"], "category_ids"),
         {:ok, categories} <- Accounts.get_user_categories(user, category_ids),
         {:ok, timestamp} <- timestamp(attrs["timestamp"]),
         activity_attrs <- activity_attrs(attrs, name),
         {:ok, activity, event} <-
           Traces.create_activity(
             trace,
             thread,
             parent,
             activity_attrs,
             %{"phase" => "B", "timestamp_integer" => timestamp},
             categories
           ) do
      :ok = EventStream.broadcast_event(user, event)
      result(user, trace, activity.id, event.id)
    else
      {:error, %Ecto.Changeset{} = changeset} -> invalid_changeset(changeset)
      other -> other
    end
  end

  defp run(user, trace, command, attrs) when command in ~w(end suspend resume) do
    phase = %{"end" => "E", "suspend" => "S", "resume" => "R"}[command]

    with {:ok, activity_id} <- positive_id(attrs["activity_id"], "activity_id"),
         {:ok, activity} <- authorized_activity(user, trace, activity_id),
         open <- Reducer.open_descendants(trace, activity),
         :ok <- allow_end(command, open, attrs["force"]),
         {:ok, timestamp} <- timestamp(attrs["timestamp"]),
         {:ok, reduction} <-
           Reducer.reduce_event(trace, activity, %{
             "phase" => phase,
             "message" => optional_string(attrs["message"]),
             "timestamp_integer" => timestamp
           }) do
      written = Enum.map(reduction.closed_descendants, & &1.event) ++ [reduction.event]
      Enum.each(written, &EventStream.broadcast_event(user, &1))

      result(user, trace, activity.id, reduction.event.id,
        closed_descendants: closed_descendants(reduction.closed_descendants)
      )
    else
      {:error, %Ecto.Changeset{} = changeset} -> invalid_changeset(changeset)
      other -> other
    end
  end

  defp run(user, trace, "status", attrs) do
    with {:ok, filters} <- status_filters(user, trace, attrs),
         {:ok, state} <- state(user, trace, filters) do
      {:ok, base_result(state)}
    end
  end

  defp run(user, trace, "message", attrs) do
    with {:ok, message} <- required_string(attrs["message"], "message"),
         {:ok, activity} <- message_activity(user, trace, attrs),
         {:ok, allow_changes} <-
           boolean(attrs["allow_stack_changes"], true, "allow_stack_changes"),
         before_id <- latest_event_id(trace),
         {:ok, reducer_result} <-
           call_reducer(user, %{
             "trace_id" => trace.id,
             "activity_id" => activity.id,
             "agent_id" => optional_string(attrs["agent_id"]),
             "message" => message,
             "allow_stack_changes" => allow_changes
           }) do
      broadcast_events_since(user, trace, before_id)
      {:ok, current_state} = state(user, trace)

      {:ok,
       base_result(current_state)
       |> Map.merge(reducer_result)
       |> Map.put(:activity_id, activity.id)}
    end
  end

  defp result(user, trace, activity_id, event_id, options \\ []) do
    with {:ok, current_state} <- state(user, trace) do
      {:ok,
       base_result(current_state)
       |> Map.put(:activity_id, activity_id)
       |> Map.put(:event_id, event_id)
       |> Map.put(:closed_descendants, Keyword.get(options, :closed_descendants, []))}
    end
  end

  defp base_result(state) do
    %{
      state: state,
      direction: nil,
      actions_applied: [],
      closed_descendants: []
    }
  end

  defp state(
         user,
         trace,
         filters \\ %{active_only: false, suspended_only: false, thread_id: nil}
       ) do
    {authorized_trace, events} = Traces.get_user_trace_with_events!(user, trace.id)
    latest = latest_events(events)
    activities_by_id = Map.new(latest, fn {_id, event} -> {event.activity.id, event.activity} end)

    open_ids =
      latest |> Enum.filter(fn {_id, event} -> event.phase in @open_phases end) |> Map.new()

    children_by_parent =
      activities_by_id
      |> Map.values()
      |> Enum.group_by(& &1.parent_id)

    views =
      latest
      |> Map.values()
      |> Enum.filter(&included?(&1, filters, latest, activities_by_id))
      |> Enum.sort_by(&{DateTime.to_unix(&1.timestamp, :microsecond), &1.id})
      |> Enum.map(fn event ->
        activity = event.activity
        descendants = open_descendant_views(activity.id, children_by_parent, open_ids)
        status = effective_status(activity, event.phase, latest, activities_by_id)

        %{
          id: activity.id,
          name: activity.name,
          threadId: activity.thread.id,
          threadName: activity.thread.name,
          parentId: activity.parent_id,
          agentId: activity.agent_id,
          path: activity_path(activity, activities_by_id),
          categoryIds: Enum.map(activity.categories, & &1.id),
          startedAt: started_at(events, activity.id),
          latestEvent: event_view(event),
          status: status,
          availableActions:
            available_actions(status, event.phase, descendants, trace.id, activity)
        }
      end)

    threads =
      authorized_trace.threads
      |> Enum.filter(&(is_nil(filters.thread_id) or &1.id == filters.thread_id))
      |> Enum.map(fn thread ->
        %{
          id: thread.id,
          name: thread.name,
          rank: thread.rank,
          availableActions: [
            %{
              operation: "start",
              arguments: %{trace_id: trace.id, thread_id: thread.id, parent_id: nil}
            }
          ]
        }
      end)

    {:ok, %{trace: %{id: trace.id, name: trace.name}, threads: threads, activities: views}}
  rescue
    Ecto.NoResultsError -> {:error, :not_found}
  end

  defp selected_thread(_user, trace, nil) do
    case trace.threads do
      [thread | _] -> {:ok, thread}
      [] -> {:error, {:invalid_input, "trace has no threads"}}
    end
  end

  defp selected_thread(user, trace, value) do
    with {:ok, id} <- positive_id(value, "thread_id") do
      {:ok, Traces.get_user_trace_thread!(user, trace.id, id)}
    end
  rescue
    Ecto.NoResultsError -> {:error, :not_found}
  end

  defp selected_parent(user, trace, thread, attrs) do
    case Map.fetch(attrs, "parent_id") do
      {:ok, nil} ->
        {:ok, nil}

      {:ok, value} ->
        explicit_parent(user, trace, thread, value)

      :error ->
        {:ok, inferred_activity(user, trace, thread.id, optional_string(attrs["agent_id"]))}
    end
  end

  defp explicit_parent(user, trace, thread, value) do
    with {:ok, id} <- positive_id(value, "parent_id") do
      case Traces.get_user_trace_thread_activity(user, trace.id, thread.id, id) do
        nil -> {:error, :not_found}
        parent -> {:ok, parent}
      end
    end
  end

  defp inferred_activity(user, trace, thread_id, agent_id) do
    {_trace, events} = Traces.get_user_trace_with_events!(user, trace.id)
    latest = latest_events(events)
    activities = Map.new(latest, fn {id, event} -> {id, event.activity} end)

    latest
    |> Map.values()
    |> Enum.filter(&(effective_status(&1.activity, &1.phase, latest, activities) == "running"))
    |> Enum.filter(&(is_nil(thread_id) or &1.activity.thread_id == thread_id))
    |> Enum.filter(&(is_nil(agent_id) or &1.activity.agent_id == agent_id))
    |> Enum.max_by(&{DateTime.to_unix(&1.timestamp, :microsecond), &1.id}, fn -> nil end)
    |> case do
      nil -> nil
      event -> event.activity
    end
  end

  defp message_activity(user, trace, attrs) do
    case attrs["activity_id"] do
      nil ->
        case inferred_activity(user, trace, nil, optional_string(attrs["agent_id"])) do
          nil -> {:error, {:invalid_input, "no active activity to message"}}
          activity -> {:ok, activity}
        end

      value ->
        with {:ok, id} <- positive_id(value, "activity_id") do
          authorized_activity(user, trace, id)
        end
    end
  end

  defp authorized_trace(user, id) do
    {:ok, Traces.get_user_trace!(user, id)}
  rescue
    Ecto.NoResultsError -> {:error, :not_found}
  end

  defp authorized_activity(user, trace, id) do
    {:ok, Traces.get_user_trace_activity!(user, trace.id, id)}
  rescue
    Ecto.NoResultsError -> {:error, :not_found}
  end

  defp allow_end("end", [_ | _] = open, force) do
    case boolean(force, false, "force") do
      {:ok, true} -> :ok
      {:ok, false} -> {:error, {:open_children, Enum.map(open, &activity_summary/1)}}
      error -> error
    end
  end

  defp allow_end("end", [], force), do: boolean(force, false, "force") |> ok_boolean()
  defp allow_end(_operation, _open, _force), do: :ok
  defp ok_boolean({:ok, _}), do: :ok
  defp ok_boolean(error), do: error

  defp activity_summary(activity), do: %{activity_id: activity.id, activity_name: activity.name}

  defp closed_descendants(closed) do
    Enum.map(closed, fn %{activity: activity, event: event} ->
      %{activity_id: activity.id, activity_name: activity.name, event_id: event.id}
    end)
  end

  defp latest_events(events) do
    events
    |> Enum.group_by(& &1.activity.id)
    |> Map.new(fn {activity_id, activity_events} ->
      lifecycle_events = Enum.filter(activity_events, &(&1.phase in @lifecycle_phases))
      candidates = if lifecycle_events == [], do: activity_events, else: lifecycle_events

      {activity_id,
       Enum.max_by(candidates, &{DateTime.to_unix(&1.timestamp, :microsecond), &1.id})}
    end)
  end

  defp included?(event, filters, latest, activities) do
    status = effective_status(event.activity, event.phase, latest, activities)

    (is_nil(filters.thread_id) or event.activity.thread_id == filters.thread_id) and
      (not filters.active_only or status == "running") and
      (not filters.suspended_only or status in ~w(suspended parent_suspended))
  end

  defp open_descendant_views(root_id, children, open_ids) do
    children
    |> Map.get(root_id, [])
    |> Enum.flat_map(fn child ->
      own = if Map.has_key?(open_ids, child.id), do: [child], else: []
      own ++ open_descendant_views(child.id, children, open_ids)
    end)
  end

  defp effective_status(activity, phase, latest, activities_by_id) do
    if AgentTransitions.status(phase) == "running" and
         suspended_ancestor?(activity.parent_id, latest, activities_by_id) do
      "parent_suspended"
    else
      AgentTransitions.status(phase)
    end
  end

  defp suspended_ancestor?(nil, _latest, _activities), do: false

  defp suspended_ancestor?(parent_id, latest, activities) do
    case {Map.get(latest, parent_id), Map.get(activities, parent_id)} do
      {%Event{phase: "S"}, _parent} -> true
      {_event, %Activity{} = parent} -> suspended_ancestor?(parent.parent_id, latest, activities)
      _ -> false
    end
  end

  defp available_actions("parent_suspended", _phase, _descendants, _trace_id, _activity),
    do: []

  defp available_actions(status, phase, descendants, trace_id, activity) do
    actions = AgentTransitions.available_actions(phase, descendants)

    actions =
      if status == "running" do
        [
          %{
            operation: "start",
            arguments: %{
              trace_id: trace_id,
              thread_id: activity.thread_id,
              parent_id: activity.id
            }
          }
          | actions
        ]
      else
        actions
      end

    Enum.map(
      actions,
      &Map.put_new(&1, :arguments, %{trace_id: trace_id, activity_id: activity.id})
    )
  end

  defp activity_path(activity, by_id) do
    case Map.get(by_id, activity.parent_id) do
      nil -> [activity.name]
      parent -> activity_path(parent, by_id) ++ [activity.name]
    end
  end

  defp started_at(events, activity_id) do
    events
    |> Enum.filter(&(&1.activity.id == activity_id and &1.phase == "B"))
    |> Enum.min_by(&{DateTime.to_unix(&1.timestamp, :microsecond), &1.id}, fn -> nil end)
    |> case do
      nil -> nil
      event -> event.timestamp
    end
  end

  defp event_view(event) do
    %{id: event.id, phase: event.phase, timestamp: event.timestamp}
    |> maybe_put(:message, event.message)
  end

  defp latest_event_id(trace) do
    from(e in Event, where: e.trace_id == ^trace.id, select: max(e.id))
    |> Repo.one()
    |> Kernel.||(0)
  end

  defp broadcast_events_since(user, trace, event_id) do
    from(e in Event, where: e.trace_id == ^trace.id and e.id > ^event_id, order_by: e.id)
    |> Repo.all()
    |> Enum.each(&EventStream.broadcast_event(user, &1))
  end

  defp call_reducer(user, arguments) do
    case System.get_env("OPENAI_API_KEY") do
      key when key in [nil, ""] ->
        {:error, :reducer_not_configured}

      _key ->
        case Application.ensure_all_started(:inets) do
          {:ok, _apps} -> ReducerAgent.handle(user, arguments)
          {:error, reason} -> {:error, {:reducer_http_runtime_failed, reason}}
        end
    end
  end

  defp activity_attrs(attrs, name) do
    agent_id = optional_string(attrs["agent_id"])

    %{"name" => name}
    |> maybe_put("description", optional_string(attrs["description"]))
    |> maybe_put("agent_id", agent_id)
    |> maybe_put(
      "agent_name",
      if(agent_id, do: Agents.display_name(agent_id, attrs["agent_name"]), else: nil)
    )
  end

  defp status_filters(user, trace, attrs) do
    with {:ok, active} <- boolean(attrs["active_only"], false, "active_only"),
         {:ok, suspended} <- boolean(attrs["suspended_only"], false, "suspended_only"),
         {:ok, thread_id} <- optional_thread_id(user, trace, attrs["thread_id"]) do
      if active and suspended do
        {:error, {:invalid_input, "active_only and suspended_only cannot both be true"}}
      else
        {:ok, %{active_only: active, suspended_only: suspended, thread_id: thread_id}}
      end
    end
  end

  defp optional_thread_id(_user, _trace, nil), do: {:ok, nil}

  defp optional_thread_id(user, trace, value) do
    with {:ok, thread} <- selected_thread(user, trace, value), do: {:ok, thread.id}
  end

  defp positive_id(value, _field) when is_integer(value) and value > 0, do: {:ok, value}

  defp positive_id(value, field) when is_binary(value) do
    case Integer.parse(value) do
      {id, ""} when id > 0 -> {:ok, id}
      _ -> {:error, {:invalid_input, "#{field} must be a positive integer"}}
    end
  end

  defp positive_id(_value, field),
    do: {:error, {:invalid_input, "#{field} must be a positive integer"}}

  defp id_list(nil, _field), do: {:ok, []}

  defp id_list(values, field) when is_list(values) do
    values
    |> Enum.reduce_while({:ok, []}, fn value, {:ok, ids} ->
      case positive_id(value, field) do
        {:ok, id} -> {:cont, {:ok, [id | ids]}}
        error -> {:halt, error}
      end
    end)
    |> case do
      {:ok, ids} -> {:ok, ids |> Enum.reverse() |> Enum.uniq()}
      error -> error
    end
  end

  defp id_list(_value, field), do: {:error, {:invalid_input, "#{field} must be a list"}}

  defp required_string(value, field) when is_binary(value) do
    case String.trim(value) do
      "" -> {:error, {:invalid_input, "#{field} is required"}}
      trimmed -> {:ok, trimmed}
    end
  end

  defp required_string(_value, field), do: {:error, {:invalid_input, "#{field} is required"}}

  defp optional_string(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      trimmed -> trimmed
    end
  end

  defp optional_string(_value), do: nil

  defp timestamp(nil), do: {:ok, System.system_time(:millisecond)}
  defp timestamp(value) when is_integer(value), do: {:ok, value}
  defp timestamp(_value), do: {:error, {:invalid_input, "timestamp must be integer milliseconds"}}

  defp boolean(nil, default, _field), do: {:ok, default}
  defp boolean(value, _default, _field) when is_boolean(value), do: {:ok, value}
  defp boolean("true", _default, _field), do: {:ok, true}
  defp boolean("false", _default, _field), do: {:ok, false}

  defp boolean(_value, _default, field),
    do: {:error, {:invalid_input, "#{field} must be boolean"}}

  defp invalid_changeset(changeset) do
    message =
      changeset
      |> Ecto.Changeset.traverse_errors(fn {text, _options} -> text end)
      |> inspect()

    {:error, {:invalid_input, message}}
  end

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)
end
