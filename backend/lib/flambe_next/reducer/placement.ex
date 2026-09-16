defmodule FlambeNext.Reducer.Placement do
  @moduledoc """
  Root placement stage of the reducer (ADR-012): puts a freshly started root activity on
  the right thread with the right categories, off the request path.
  """

  import Ecto.Query

  require Logger

  alias FlambeNext.Accounts
  alias FlambeNext.Accounts.User
  alias FlambeNext.Reducer.Model
  alias FlambeNext.Repo
  alias FlambeNext.Traces
  alias FlambeNext.Traces.{Activity, Event, Trace}
  alias FlambeNextWeb.EventStream

  @doc """
  Places a root activity asynchronously. Returns `:skipped` when there is nothing to
  decide or no model is configured; the activity is already recorded either way.
  """
  def place_root_async(%User{} = user, %Activity{parent_id: nil} = activity) do
    if Model.configured?() do
      Task.Supervisor.start_child(FlambeNext.TaskSupervisor, fn -> place_root(user, activity) end)
      :started
    else
      :skipped
    end
  end

  def place_root_async(_user, _activity), do: :skipped

  @doc false
  def place_root(%User{} = user, %Activity{parent_id: nil} = activity, opts \\ []) do
    activity = Repo.preload(activity, [:categories, thread: :trace])
    trace = Traces.get_user_trace!(user, activity.thread.trace_id)
    threads = trace.threads
    categories = Accounts.list_user_categories(user)

    if length(threads) < 2 and categories == [] do
      :skipped
    else
      context = placement_context(user, activity, threads, categories)
      # Tests inject `:llm` to avoid the network; production uses the primary model.
      llm = Keyword.get(opts, :llm, &Model.call/2)

      case placement_decision(
             llm,
             Model.primary_model(),
             placement_prompt(context),
             threads,
             categories
           ) do
        {:ok, decision} ->
          apply_placement(user, activity, decision, threads)

        {:error, reason} ->
          Logger.warning(
            "reducer placement skipped for activity #{activity.id}: #{inspect(reason)}"
          )

          {:error, reason}
      end
    end
  end

  defp placement_context(user, activity, threads, categories) do
    recent =
      if activity.agent_id do
        from(a in Activity,
          join: thread in assoc(a, :thread),
          where:
            thread.trace_id == ^activity.thread.trace_id and a.agent_id == ^activity.agent_id and
              a.id != ^activity.id,
          order_by: [desc: a.id],
          limit: 8,
          preload: [:categories]
        )
        |> Repo.all()
        |> Enum.map(
          &%{
            name: &1.name,
            thread_id: &1.thread_id,
            category_ids: Enum.map(&1.categories, fn c -> c.id end)
          }
        )
      else
        []
      end

    %{
      activity: %{
        id: activity.id,
        name: activity.name,
        description: activity.description,
        agent_name: activity.agent_name,
        agent_platform: agent_platform(user, activity.agent_id),
        thread_id: activity.thread_id
      },
      threads: Enum.map(threads, &%{id: &1.id, name: &1.name}),
      categories: Enum.map(categories, &%{id: &1.id, name: &1.name}),
      recent_by_same_agent: recent,
      user: user.username
    }
  end

  defp agent_platform(_user, nil), do: nil

  defp agent_platform(user, agent_id) do
    case FlambeNext.Agents.get(user, agent_id) do
      %{platform: platform} -> platform
      nil -> nil
    end
  end

  defp placement_prompt(context) do
    """
    You are Flambe's Reducer Agent. A worker just started a new top-level activity (a root)
    and left the placement to you. Choose the thread (a workstream lane) and the categories
    that fit it best.

    Rules:
    - thread_id MUST be one of the listed threads. Keep the current thread_id unless another
      thread's name clearly matches the activity; the recent activities of the same agent
      are a strong hint about which thread it works in.
    - category_ids MUST be a subset of the listed categories. Assign every label that fits
      the activity (typically 1-3). These are work-kind labels (bug fixing, research,
      design, writing tests, toil, …), not project names.
    - Prefer a close match over leaving the activity uncategorized. Return an empty
      category_ids list only when none of the listed labels apply at all.
    - When unsure about the thread, keep the current thread_id; still assign categories.

    Return ONLY one JSON object with exactly these keys:
    {"thread_id": INTEGER, "category_ids": ARRAY_OF_INTEGERS, "rationale": STRING}

    Context:
    #{Jason.encode!(context)}
    """
  end

  defp placement_decision(llm, model, prompt, threads, categories) do
    thread_ids = MapSet.new(threads, & &1.id)
    category_ids = MapSet.new(categories, & &1.id)

    with {:ok, raw} <- llm.(model, prompt),
         {:ok, %{"thread_id" => thread_id, "category_ids" => ids, "rationale" => rationale}}
         when is_integer(thread_id) and is_list(ids) and is_binary(rationale) <-
           Jason.decode(raw),
         true <- MapSet.member?(thread_ids, thread_id),
         true <- Enum.all?(ids, &(is_integer(&1) and MapSet.member?(category_ids, &1))) do
      {:ok,
       %{thread_id: thread_id, category_ids: Enum.uniq(ids), rationale: rationale, model: model}}
    else
      {:error, reason} -> {:error, reason}
      _ -> {:error, :invalid_model_response}
    end
  end

  defp apply_placement(user, activity, decision, threads) do
    from_thread = activity.thread
    to_thread = Enum.find(threads, &(&1.id == decision.thread_id))
    moved? = to_thread.id != from_thread.id

    with {:ok, categories} <- Accounts.get_user_categories(user, decision.category_ids),
         {:ok, activity} <-
           if(moved?,
             do: Traces.move_activity_subtree(user, activity, to_thread.id),
             else: {:ok, activity}
           ),
         {:ok, activity} <-
           Traces.update_activity(Repo.preload(activity, :categories), %{}, categories) do
      trace = Repo.get!(Trace, from_thread.trace_id)

      summary =
        [
          "model=#{decision.model}",
          moved? && "thread=#{from_thread.name}->#{to_thread.name}",
          "categories=#{Enum.map_join(categories, ",", & &1.name)}",
          "rationale=#{decision.rationale}"
        ]
        |> Enum.reject(&(&1 in [nil, false]))
        |> Enum.join(" | ")

      {:ok, decision_event} =
        Traces.create_event(trace, activity, %{
          "phase" => "reducer_decision",
          "message" => "placed | " <> summary,
          "timestamp_integer" => System.system_time(:millisecond)
        })

      # Re-broadcast the activity's existing events so the SPA picks up the new thread and
      # categories; then the decision itself.
      from(e in Event, where: e.activity_id == ^activity.id and e.id != ^decision_event.id)
      |> Repo.all()
      |> Enum.each(&EventStream.broadcast_event(user, &1))

      :ok = EventStream.broadcast_event(user, decision_event)

      {:ok,
       %{moved?: moved?, thread_id: to_thread.id, category_ids: Enum.map(categories, & &1.id)}}
    end
  end
end
