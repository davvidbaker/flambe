defmodule FlambeNext.Reducer do
  @moduledoc """
  Deterministic reduction of worker lifecycle events (ADR-011).

  Workers propose transitions; this module folds them into the stack without a model,
  so it keeps working when `OPENAI_API_KEY` is absent. It reinterprets, it never drops:
  a proposed event is always recorded, and the stack invariants are restored around it.

  Rules:

  - Ending an activity also ends any descendant that is still open (latest lifecycle
    phase `B` or `R`), deepest first, at the same timestamp.
  - Starting an activity resolves what the worker left open (ADR-012): an absent
    `parent_id` infers the agent's own newest active activity; a child lives in its
    parent's thread; missing categories are inherited from the parent.
  """

  import Ecto.Query

  alias FlambeNext.Accounts
  alias FlambeNext.Accounts.User
  alias FlambeNext.Repo
  alias FlambeNext.Traces
  alias FlambeNext.Traces.{Activity, Event, Thread, Trace}

  @open_phases ~w(B R)
  # Reducer bookkeeping events (`reducer_*`) are annotations; they do not change whether
  # an activity is open.
  @lifecycle_phases ~w(B E S R)

  @type start_notes :: %{
          parent_source: :inferred | :explicit | :root,
          thread_source: :parent | :request | :default,
          categories_source: :request | :parent | :none
        }

  @doc """
  Creates an activity from a worker's `start` proposal.

  `params`:
    * `"thread_id"` — optional; ignored when a parent exists
    * `"activity"` — activity attrs; `parent_id` absent = infer, `nil` = root
    * `"event"` — the `B` event attrs
    * `:agent_id` — the calling agent, used to scope parent inference
  """
  @spec reduce_start(User.t(), Trace.t(), map()) ::
          {:ok, %{activity: Activity.t(), event: Event.t(), notes: start_notes()}}
          | {:error, :not_found | Ecto.Changeset.t()}
  def reduce_start(%User{} = user, %Trace{} = trace, params) when is_map(params) do
    activity_attrs = Map.get(params, "activity", %{})
    event_attrs = Map.get(params, "event", %{})
    agent_id = Map.get(params, :agent_id)

    with {:ok, parent, parent_source} <-
           resolve_parent(trace, Map.get(params, "thread_id"), activity_attrs, agent_id),
         {:ok, thread, thread_source} <-
           resolve_thread(trace, parent, Map.get(params, "thread_id")),
         {:ok, categories, categories_source} <-
           resolve_categories(user, parent, Map.get(activity_attrs, "categories", [])),
         {:ok, activity, event} <-
           Traces.create_activity(trace, thread, parent, activity_attrs, event_attrs, categories) do
      {:ok,
       %{
         activity: activity,
         event: event,
         notes: %{
           parent_source: parent_source,
           thread_source: thread_source,
           categories_source: categories_source
         }
       }}
    end
  end

  @doc """
  The newest activity in `trace` whose latest lifecycle event is `B` or `R`, optionally
  restricted to one agent. Preloads `:thread` and `:categories`.
  """
  @spec newest_active_activity(Trace.t(), keyword()) :: Activity.t() | nil
  def newest_active_activity(%Trace{id: trace_id}, opts \\ []) do
    latest =
      from(e in Event,
        where: e.trace_id == ^trace_id and e.phase in @lifecycle_phases,
        distinct: e.activity_id,
        order_by: [asc: e.activity_id, desc: e.timestamp, desc: e.id],
        select: %{activity_id: e.activity_id, phase: e.phase, timestamp: e.timestamp, id: e.id}
      )

    query =
      from(a in Activity,
        join: l in subquery(latest),
        on: l.activity_id == a.id,
        where: l.phase in @open_phases,
        order_by: [desc: l.timestamp, desc: l.id],
        limit: 1,
        preload: [:thread, :categories]
      )

    query =
      case Keyword.fetch(opts, :agent_id) do
        {:ok, agent_id} when is_binary(agent_id) -> where(query, [a], a.agent_id == ^agent_id)
        _ -> query
      end

    query =
      case Keyword.fetch(opts, :thread_id) do
        {:ok, thread_id} when not is_nil(thread_id) ->
          where(query, [a], a.thread_id == ^thread_id)

        _ ->
          query
      end

    Repo.one(query)
  end

  defp resolve_parent(trace, thread_id, activity_attrs, agent_id) do
    case Map.fetch(activity_attrs, "parent_id") do
      {:ok, nil} ->
        {:ok, nil, :root}

      {:ok, parent_id} ->
        case fetch_parent(trace, parent_id) do
          nil -> {:error, :not_found}
          parent -> {:ok, parent, :explicit}
        end

      :error ->
        # Without an agent id there is nothing to scope by, so fall back to the old
        # "newest active in the requested thread" behaviour.
        scope =
          if is_binary(agent_id),
            do: [agent_id: agent_id],
            else: [thread_id: requested_thread_id(trace, thread_id)]

        case newest_active_activity(trace, scope) do
          nil -> {:ok, nil, :root}
          parent -> {:ok, parent, :inferred}
        end
    end
  end

  # `trace` already belongs to the user (fetched with `get_user_trace!`), so scoping the
  # parent to the trace is enough.
  defp fetch_parent(trace, parent_id) when is_binary(parent_id) do
    case Integer.parse(parent_id) do
      {id, ""} -> fetch_parent(trace, id)
      _ -> nil
    end
  end

  defp fetch_parent(trace, parent_id) when is_integer(parent_id) and parent_id > 0 do
    from(a in Activity,
      join: thread in assoc(a, :thread),
      where: a.id == ^parent_id and thread.trace_id == ^trace.id,
      preload: [:thread, :categories]
    )
    |> Repo.one()
  end

  defp fetch_parent(_trace, _parent_id), do: nil

  defp requested_thread_id(trace, thread_id) do
    case resolve_thread(trace, nil, thread_id) do
      {:ok, %Thread{id: id}, _} -> id
      _ -> nil
    end
  end

  defp resolve_thread(_trace, %Activity{thread: %Thread{} = thread}, _thread_id),
    do: {:ok, thread, :parent}

  defp resolve_thread(trace, nil, nil) do
    case trace.threads do
      [thread | _] -> {:ok, thread, :default}
      [] -> {:error, :not_found}
    end
  end

  defp resolve_thread(trace, nil, thread_id) do
    id =
      case thread_id do
        id when is_integer(id) -> id
        id when is_binary(id) -> with({n, ""} <- Integer.parse(id), do: n, else: (_ -> nil))
        _ -> nil
      end

    case Enum.find(trace.threads, &(&1.id == id)) do
      %Thread{} = thread -> {:ok, thread, :request}
      nil -> {:error, :not_found}
    end
  end

  defp resolve_categories(user, parent, requested) do
    case List.wrap(requested) do
      [] ->
        case parent do
          %Activity{categories: [_ | _] = categories} -> {:ok, categories, :parent}
          _ -> {:ok, [], :none}
        end

      ids ->
        with {:ok, categories} <- Accounts.get_user_categories(user, ids) do
          {:ok, categories, :request}
        end
    end
  end

  @type closed :: %{activity: Activity.t(), event: Event.t()}
  @type result :: %{event: Event.t(), closed_descendants: [closed()]}

  @doc """
  Records `attrs` for `activity`, plus whatever the stack invariants require.

  Returns the proposed event and the descendants the reducer closed, in write order.
  """
  @spec reduce_event(Trace.t(), Activity.t(), map()) ::
          {:ok, result()} | {:error, Ecto.Changeset.t()}
  def reduce_event(%Trace{} = trace, %Activity{} = activity, attrs) when is_map(attrs) do
    case phase(attrs) do
      "E" -> end_with_descendants(trace, activity, attrs)
      _ -> plain(trace, activity, attrs)
    end
  end

  @doc """
  Activities below `activity` whose latest event is still open, deepest first.
  """
  @spec open_descendants(Trace.t(), Activity.t()) :: [Activity.t()]
  def open_descendants(%Trace{id: trace_id}, %Activity{id: root_id}) do
    activities =
      from(a in Activity,
        join: thread in assoc(a, :thread),
        where: thread.trace_id == ^trace_id,
        select: {a.id, a.parent_id}
      )
      |> Repo.all()

    children =
      Enum.group_by(activities, fn {_id, parent_id} -> parent_id end, fn {id, _} -> id end)

    descendants = collect_descendants(children, [root_id], %{}, 1)

    if descendants == %{} do
      []
    else
      ids = Map.keys(descendants)

      open_ids =
        from(e in Event,
          where: e.activity_id in ^ids and e.phase in @lifecycle_phases,
          distinct: e.activity_id,
          order_by: [asc: e.activity_id, desc: e.timestamp, desc: e.id],
          select: {e.activity_id, e.phase}
        )
        |> Repo.all()
        |> Enum.filter(fn {_id, phase} -> phase in @open_phases end)
        |> Enum.map(fn {id, _} -> id end)

      from(a in Activity, where: a.id in ^open_ids)
      |> Repo.all()
      |> Enum.sort_by(fn a -> {-Map.fetch!(descendants, a.id), -a.id} end)
    end
  end

  defp collect_descendants(_children, [], acc, _depth), do: acc

  defp collect_descendants(children, ids, acc, depth) do
    next =
      ids
      |> Enum.flat_map(&Map.get(children, &1, []))
      |> Enum.reject(&Map.has_key?(acc, &1))

    acc = Enum.reduce(next, acc, &Map.put(&2, &1, depth))
    collect_descendants(children, next, acc, depth + 1)
  end

  defp plain(trace, activity, attrs) do
    with {:ok, event} <- Traces.create_event(trace, activity, attrs) do
      {:ok, %{event: event, closed_descendants: []}}
    end
  end

  defp end_with_descendants(trace, activity, attrs) do
    open = open_descendants(trace, activity)

    Repo.transaction(fn ->
      closed =
        Enum.map(open, fn descendant ->
          descendant_attrs = %{
            "phase" => "E",
            "message" =>
              "Ended by reducer: parent activity #{activity.id} (#{activity.name}) ended",
            "timestamp_integer" => timestamp_integer(attrs)
          }

          case Traces.create_event(trace, descendant, descendant_attrs) do
            {:ok, event} -> %{activity: descendant, event: event}
            {:error, changeset} -> Repo.rollback(changeset)
          end
        end)

      case Traces.create_event(trace, activity, attrs) do
        {:ok, event} -> %{event: event, closed_descendants: closed}
        {:error, changeset} -> Repo.rollback(changeset)
      end
    end)
  end

  defp phase(attrs), do: Map.get(attrs, "phase") || Map.get(attrs, :phase)

  defp timestamp_integer(attrs) do
    case Map.get(attrs, "timestamp_integer") || Map.get(attrs, :timestamp_integer) do
      value when is_integer(value) -> value
      _ -> System.system_time(:millisecond)
    end
  end
end
