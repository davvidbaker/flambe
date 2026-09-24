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

  require Logger

  alias FlambeNext.Accounts
  alias FlambeNext.Accounts.User
  alias FlambeNext.Repo
  alias FlambeNext.Reducer.{Model, Review}
  alias FlambeNext.Traces
  alias FlambeNext.Traces.{Activity, Event, Thread, Trace}

  @lifecycle_phases ~w(B R X S E J V)
  @open_phases ~w(B R X)
  @ended_phases ~w(E J V)

  @type fold_result :: %{
          activity: Activity.t() | nil,
          event: Event.t() | nil,
          notes: start_notes() | nil,
          closed_descendants: [closed()],
          actions_applied: [map()],
          rules_fired: [map()],
          extra_events: [Event.t()],
          direction: String.t() | nil,
          reply: String.t() | nil,
          review: map() | nil
        }

  @doc """
  Folds one worker proposal into the stack (ADR-014). Lifecycle commands are
  deterministic. `message` runs the model review stage when a model is available.
  """
  @spec fold(User.t(), Trace.t(), map()) :: {:ok, fold_result()} | {:error, term()}
  def fold(%User{} = user, %Trace{} = trace, proposal) when is_map(proposal) do
    case Map.get(proposal, :command) do
      "start" -> fold_start(user, trace, proposal)
      command when command in ~w(end suspend resume) -> fold_lifecycle(trace, proposal)
      "message" -> fold_message(user, proposal)
      other -> {:error, {:invalid_input, "unknown command: #{other}"}}
    end
  end

  defp fold_start(user, trace, proposal) do
    params = Map.get(proposal, :params, %{})
    activity_attrs = Map.get(params, "activity", %{})
    agent_id = Map.get(params, :agent_id) || Map.get(activity_attrs, "agent_id")
    name = Map.get(activity_attrs, "name")
    timestamp = timestamp_integer(Map.get(params, "event", %{}))

    case Map.get(params, "activity_id") do
      nil ->
        fold_new_or_duplicate(user, trace, params, activity_attrs, agent_id, name, timestamp)

      activity_id ->
        case fetch_parent(trace, activity_id) do
          nil ->
            {:error, :not_found}

          %Activity{} = target ->
            if latest_phase(trace.id, target.id) == nil do
              begin_limbo(
                trace,
                target,
                timestamp,
                agent_id,
                Map.get(activity_attrs, "agent_name")
              )
            else
              {:error, {:invalid_input, "activity has already begun"}}
            end
        end
    end
  end

  defp fold_new_or_duplicate(user, trace, params, activity_attrs, agent_id, name, timestamp) do
    case duplicate_activity(trace, agent_id, name) || limbo_activity(trace, agent_id, name) do
      %Activity{} = existing ->
        if is_nil(latest_phase(trace.id, existing.id)) do
          begin_limbo(trace, existing, timestamp, agent_id, Map.get(activity_attrs, "agent_name"))
        else
          reuse_existing(trace, existing, timestamp)
        end

      nil ->
        with {:ok, parent, _source} <-
               resolve_parent(trace, Map.get(params, "thread_id"), activity_attrs, agent_id),
             :ok <- ensure_parent_begun(trace, parent),
             {:ok, resumed_events} <- resume_suspended_ancestors(trace, parent, timestamp),
             {:ok, %{activity: activity, event: event, notes: notes}} <-
               reduce_start(user, trace, params) do
          resumed_ids = Enum.map(resumed_events, & &1.activity_id)

          folded = %{
            blank_fold()
            | activity: activity,
              event: event,
              notes: notes,
              actions_applied:
                Enum.map(resumed_ids, &%{type: "resume_ancestor", activity_id: &1}),
              rules_fired:
                if(resumed_ids == [],
                  do: [],
                  else: [%{rule: "resume_ancestor", applied: resumed_ids}]
                ),
              extra_events: resumed_events
          }

          structure_review(user, trace, folded, agent_id)
        end
    end
  end

  defp fold_lifecycle(trace, proposal) do
    activity = Map.fetch!(proposal, :activity)
    event_attrs = Map.get(proposal, :event_attrs, %{})

    open =
      if(ended_phase?(phase(event_attrs)), do: open_descendants(trace, activity), else: :not_end)

    case reduce_event(trace, activity, event_attrs) do
      {:ok, %{event: event, closed_descendants: closed}} ->
        rules = pop_to_parent_rule(activity, open)

        {:ok,
         %{
           blank_fold()
           | activity: activity,
             event: event,
             closed_descendants: closed,
             rules_fired: rules
         }}

      error ->
        error
    end
  end

  defp fold_message(user, proposal) do
    opts = Map.get(proposal, :opts, [])

    if Model.available?(opts) do
      case Review.handle(user, Map.get(proposal, :attrs, %{}), opts) do
        {:ok, review} ->
          {:ok,
           %{
             blank_fold()
             | direction: review.direction,
               reply: review.reply,
               actions_applied: review.actions_applied,
               review: review
           }}

        error ->
          error
      end
    else
      {:error, :reducer_not_configured}
    end
  end

  defp structure_review(user, trace, folded, agent_id) do
    case structure_rule(trace, folded.activity, agent_id) do
      nil ->
        {:ok, folded}

      rule ->
        case structure_llm() do
          nil ->
            {:ok, note_structure(trace, folded, rule, %{type: "skipped"}, nil, nil)}

          llm ->
            judge_structure(user, trace, folded, rule, llm)
        end
    end
  end

  defp judge_structure(user, trace, folded, rule, llm) do
    case Review.judge_structure(user, folded.activity, rule, llm: llm) do
      {:ok, judgment} ->
        apply_structure_judgment(user, trace, folded, rule, judgment)

      {:error, reason} ->
        Logger.warning(
          "structure review skipped for activity #{folded.activity.id}: #{inspect(reason)}"
        )

        {:ok, note_structure(trace, folded, rule, %{type: "skipped"}, nil, nil)}
    end
  end

  defp structure_rule(trace, %Activity{parent_id: nil} = activity, agent_id)
       when is_binary(agent_id) do
    case other_open_leaf(trace, agent_id, activity.id) do
      nil ->
        nil

      leaf ->
        root = root_of(leaf) || leaf

        %{
          name: "new_root_while_open",
          open_leaf: %{id: leaf.id, name: leaf.name},
          previous_root: %{id: root.id, name: root.name},
          ancestors: [],
          candidate_ids: Enum.uniq([leaf.id, root.id])
        }
    end
  end

  defp structure_rule(_trace, %Activity{parent_id: parent_id} = activity, _agent_id)
       when is_integer(parent_id) do
    ancestors = ancestor_activities(activity)

    if name_unfit?(activity.name, Enum.map(ancestors, & &1.name)) do
      %{
        name: "name_unfit",
        open_leaf: nil,
        previous_root: nil,
        ancestors: Enum.map(ancestors, &%{id: &1.id, name: &1.name}),
        candidate_ids: Enum.map(ancestors, & &1.id)
      }
    else
      nil
    end
  end

  defp structure_rule(_trace, _activity, _agent_id), do: nil

  defp structure_llm do
    case Application.get_env(:flambe_next, :reducer_llm) do
      llm when is_function(llm, 2) ->
        llm

      _ ->
        if Mix.env() == :test or not Model.configured?(), do: nil, else: &Model.call/2
    end
  end

  defp apply_structure_judgment(user, trace, folded, rule, judgment) do
    case judgment.action do
      %{type: "reparent", parent_activity_id: parent_id} ->
        case reparent(user, trace, folded.activity, parent_id) do
          {:ok, activity} ->
            {:ok,
             note_structure(
               trace,
               %{folded | activity: activity},
               rule,
               judgment.action,
               judgment.direction,
               judgment.reply
             )}

          {:error, reason} ->
            Logger.warning("structure reparent skipped: #{inspect(reason)}")
            {:ok, note_structure(trace, folded, rule, %{type: "skipped"}, nil, nil)}
        end

      %{type: "rename", name: name} ->
        case rename_activity(folded.activity, name) do
          {:ok, activity} ->
            {:ok,
             note_structure(
               trace,
               %{folded | activity: activity},
               rule,
               judgment.action,
               judgment.direction,
               judgment.reply
             )}

          {:error, reason} ->
            Logger.warning("structure rename skipped: #{inspect(reason)}")
            {:ok, note_structure(trace, folded, rule, %{type: "skipped"}, nil, nil)}
        end

      action ->
        {:ok, note_structure(trace, folded, rule, action, judgment.direction, judgment.reply)}
    end
  end

  defp note_structure(trace, folded, rule, action, direction, reply) do
    {:ok, decision} =
      Traces.create_event(trace, folded.activity, %{
        "phase" => "reducer_decision",
        "message" => "rule=#{rule.name} | applied=#{action.type}",
        "timestamp_integer" => System.system_time(:millisecond)
      })

    %{
      folded
      | direction: direction,
        reply: reply,
        actions_applied: folded.actions_applied ++ [action],
        rules_fired: folded.rules_fired ++ [%{rule: rule.name, applied: action}],
        extra_events: folded.extra_events ++ [decision]
    }
  end

  defp reparent(user, trace, activity, parent_id) do
    parent = Traces.get_user_trace_activity!(user, trace.id, parent_id)
    now = DateTime.utc_now(:second)

    {1, _} =
      from(a in Activity, where: a.id == ^activity.id)
      |> Repo.update_all(
        set: [parent_id: parent.id, thread_id: parent.thread_id, updated_at: now]
      )

    {:ok, Repo.get!(Activity, activity.id)}
  rescue
    Ecto.NoResultsError -> {:error, :not_found}
  end

  defp rename_activity(activity, name) do
    activity = Repo.preload(activity, :categories)
    Traces.update_activity(activity, %{"name" => name}, activity.categories)
  end

  defp other_open_leaf(%Trace{id: trace_id}, agent_id, except_id) do
    from(a in Activity,
      join: thread in assoc(a, :thread),
      where: thread.trace_id == ^trace_id and a.agent_id == ^agent_id and a.id != ^except_id,
      order_by: [desc: a.id]
    )
    |> Repo.all()
    |> Enum.find(&(latest_phase(trace_id, &1.id) in @open_phases))
  end

  defp root_of(%Activity{parent_id: nil} = activity), do: activity

  defp root_of(%Activity{parent_id: parent_id}) do
    case Repo.get(Activity, parent_id) do
      %Activity{} = parent -> root_of(parent)
      nil -> nil
    end
  end

  defp ancestor_activities(%Activity{parent_id: nil}), do: []

  defp ancestor_activities(%Activity{parent_id: parent_id}) do
    case Repo.get(Activity, parent_id) do
      nil -> []
      parent -> ancestor_activities(parent) ++ [parent]
    end
  end

  @name_stopwords ~w(the and for with from into that this work task item stuff)

  defp name_unfit?(name, ancestor_names) do
    child = content_tokens(name)
    ancestors = ancestor_names |> Enum.flat_map(&content_tokens/1) |> MapSet.new()
    child != [] and MapSet.disjoint?(MapSet.new(child), ancestors)
  end

  defp content_tokens(name) when is_binary(name) do
    name
    |> String.downcase()
    |> String.split(~r/[^a-z0-9]+/, trim: true)
    |> Enum.reject(&(byte_size(&1) < 4 or &1 in @name_stopwords))
  end

  defp content_tokens(_name), do: []

  defp blank_fold do
    %{
      activity: nil,
      event: nil,
      notes: nil,
      closed_descendants: [],
      actions_applied: [],
      rules_fired: [],
      extra_events: [],
      direction: nil,
      reply: nil,
      review: nil
    }
  end

  defp duplicate_activity(_trace, agent_id, name)
       when not is_binary(agent_id) or not is_binary(name),
       do: nil

  defp duplicate_activity(%Trace{id: trace_id}, agent_id, name) do
    name = String.trim(name)

    from(a in Activity,
      join: thread in assoc(a, :thread),
      where: thread.trace_id == ^trace_id and a.agent_id == ^agent_id and a.name == ^name,
      order_by: [desc: a.id],
      limit: 8
    )
    |> Repo.all()
    |> Enum.find(fn activity ->
      latest_phase(trace_id, activity.id) in (@open_phases ++ ["S"])
    end)
  end

  defp limbo_activity(_trace, agent_id, name)
       when not is_binary(agent_id) or not is_binary(name),
       do: nil

  defp limbo_activity(%Trace{id: trace_id}, agent_id, name) do
    name = String.trim(name)

    from(a in Activity,
      join: thread in assoc(a, :thread),
      where:
        thread.trace_id == ^trace_id and a.proposed_by_agent_id == ^agent_id and a.name == ^name and
          is_nil(a.scheduled_start) and is_nil(a.scheduled_end),
      order_by: [desc: a.id],
      limit: 8
    )
    |> Repo.all()
    |> Enum.find(&(latest_phase(trace_id, &1.id) == nil))
  end

  defp begin_limbo(trace, %Activity{} = existing, timestamp, agent_id, agent_name) do
    with :ok <- ensure_parent_begun(trace, parent_of(existing)),
         {:ok, activity, event} <-
           Traces.begin_unstarted_activity(
             trace,
             existing,
             %{
               "phase" => "B",
               "message" => "Begun by reducer: a start matched this activity in limbo",
               "timestamp_integer" => timestamp
             },
             actor(agent_id, agent_name)
           ) do
      applied = %{type: "begin_existing", activity_id: activity.id}

      {:ok, decision} =
        Traces.create_event(trace, activity, %{
          "phase" => "reducer_decision",
          "message" => "rule=begin_limbo | applied=begin_existing",
          "timestamp_integer" => timestamp
        })

      {:ok,
       %{
         blank_fold()
         | activity: activity,
           event: event,
           actions_applied: [applied],
           rules_fired: [%{rule: "begin_limbo", applied: applied}],
           extra_events: [decision]
       }}
    end
  end

  defp parent_of(%Activity{parent_id: nil}), do: nil
  defp parent_of(%Activity{parent_id: parent_id}), do: Repo.get(Activity, parent_id)

  defp actor(agent_id, _name) when not is_binary(agent_id), do: nil

  defp actor(agent_id, name) do
    %{agent_id: agent_id, agent_name: name || agent_id}
  end

  defp ensure_parent_begun(_trace, nil), do: :ok

  defp ensure_parent_begun(trace, %Activity{} = parent) do
    if latest_phase(trace.id, parent.id) == nil do
      {:error, :parent_unstarted}
    else
      :ok
    end
  end

  defp reuse_existing(trace, %Activity{} = existing, timestamp) do
    phase = latest_phase(trace.id, existing.id)

    {event, _action, applied} =
      if phase == "S" do
        {:ok, event} =
          Traces.create_event(trace, existing, %{
            "phase" => "R",
            "message" => "Resumed by reducer: a start duplicated this suspended activity",
            "timestamp_integer" => timestamp
          })

        {event, "resume_existing", %{type: "resume_existing", activity_id: existing.id}}
      else
        {latest_lifecycle_event(trace.id, existing.id), "no_op",
         %{type: "no_op", activity_id: existing.id}}
      end

    {:ok, decision} =
      Traces.create_event(trace, existing, %{
        "phase" => "reducer_decision",
        "message" => "rule=duplicate_open | applied=#{applied.type}",
        "timestamp_integer" => timestamp
      })

    {:ok,
     %{
       blank_fold()
       | activity: existing,
         event: event,
         actions_applied: [applied],
         rules_fired: [%{rule: "duplicate_open", applied: applied}],
         extra_events: [decision]
     }}
  end

  defp resume_suspended_ancestors(_trace, nil, _timestamp), do: {:ok, []}

  defp resume_suspended_ancestors(trace, %Activity{} = activity, timestamp) do
    chain = suspended_chain(trace.id, activity, [])

    Enum.reduce_while(Enum.reverse(chain), {:ok, []}, fn ancestor, {:ok, events} ->
      case Traces.create_event(trace, ancestor, %{
             "phase" => "R",
             "message" => "Resumed by reducer: a child was started under suspended work",
             "timestamp_integer" => timestamp
           }) do
        {:ok, event} -> {:cont, {:ok, [event | events]}}
        {:error, changeset} -> {:halt, {:error, changeset}}
      end
    end)
  end

  defp suspended_chain(_trace_id, nil, acc), do: acc

  defp suspended_chain(trace_id, %Activity{parent_id: nil} = activity, acc) do
    if(latest_phase(trace_id, activity.id) == "S", do: [activity | acc], else: acc)
  end

  defp suspended_chain(trace_id, %Activity{} = activity, acc) do
    acc = if(latest_phase(trace_id, activity.id) == "S", do: [activity | acc], else: acc)
    suspended_chain(trace_id, Repo.get(Activity, activity.parent_id), acc)
  end

  defp pop_to_parent_rule(_activity, :not_end), do: []
  defp pop_to_parent_rule(%Activity{parent_id: nil}, _open), do: []
  defp pop_to_parent_rule(_activity, [_ | _]), do: []

  defp pop_to_parent_rule(%Activity{parent_id: parent_id}, []) do
    parent = Repo.get!(Activity, parent_id)
    [%{rule: "pop_to_parent", applied: %{activity_id: parent.id, name: parent.name}}]
  end

  defp latest_phase(trace_id, activity_id) do
    from(e in Event,
      where:
        e.trace_id == ^trace_id and e.activity_id == ^activity_id and
          e.phase in @lifecycle_phases,
      order_by: [desc: e.timestamp, desc: e.id],
      limit: 1,
      select: e.phase
    )
    |> Repo.one()
  end

  defp latest_lifecycle_event(trace_id, activity_id) do
    from(e in Event,
      where:
        e.trace_id == ^trace_id and e.activity_id == ^activity_id and
          e.phase in @lifecycle_phases,
      order_by: [desc: e.timestamp, desc: e.id],
      limit: 1
    )
    |> Repo.one()
  end

  # Reducer bookkeeping events (`reducer_*`) are annotations; they do not change whether
  # an activity is open.

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

    query
    |> Repo.all()
    |> Enum.find(&(not suspended_ancestor?(trace_id, &1.parent_id)))
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
        with {:ok, scope} <- inference_scope(trace, thread_id, agent_id) do
          case newest_active_activity(trace, scope) do
            nil -> {:ok, nil, :root}
            parent -> {:ok, parent, :inferred}
          end
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

  defp inference_scope(_trace, _thread_id, agent_id) when is_binary(agent_id),
    do: {:ok, [agent_id: agent_id]}

  defp inference_scope(trace, thread_id, _agent_id) do
    with {:ok, %Thread{id: id}, _source} <- resolve_thread(trace, nil, thread_id) do
      {:ok, [thread_id: id]}
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

  defp suspended_ancestor?(_trace_id, nil), do: false

  defp suspended_ancestor?(trace_id, parent_id) do
    parent = Repo.get(Activity, parent_id)

    latest_phase =
      from(e in Event,
        where:
          e.trace_id == ^trace_id and e.activity_id == ^parent_id and
            e.phase in @lifecycle_phases,
        order_by: [desc: e.timestamp, desc: e.id],
        limit: 1,
        select: e.phase
      )
      |> Repo.one()

    latest_phase == "S" or
      (match?(%Activity{}, parent) and suspended_ancestor?(trace_id, parent.parent_id))
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
      ended when ended in @ended_phases -> end_with_descendants(trace, activity, attrs)
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

  defp ended_phase?(phase), do: phase in @ended_phases

  defp timestamp_integer(attrs) do
    case Map.get(attrs, "timestamp_integer") || Map.get(attrs, :timestamp_integer) do
      value when is_integer(value) -> value
      _ -> System.system_time(:millisecond)
    end
  end
end
