defmodule FlambeNext.Traces do
  import Ecto.Query

  alias Ecto.Multi
  alias FlambeNext.Accounts.User
  alias FlambeNext.Repo
  alias FlambeNext.Traces.{Activity, Event, Thread, Trace}

  def list_traces do
    Repo.all(Trace)
  end

  def get_trace!(id) do
    Trace
    |> Repo.get!(id)
    |> Repo.preload(threads: from(thread in Thread, order_by: [asc: thread.rank, asc: thread.id]))
  end

  def get_user_trace!(%User{} = user, id) do
    Trace
    |> where([trace], trace.user_id == ^user.id and trace.id == ^id)
    |> Repo.one!()
    |> Repo.preload(threads: from(thread in Thread, order_by: [asc: thread.rank, asc: thread.id]))
  end

  def get_user_trace_with_events!(%User{} = user, id) do
    trace = get_user_trace!(user, id)

    events =
      from(event in Event,
        where: event.trace_id == ^trace.id,
        order_by: [asc: event.timestamp, asc: event.id],
        preload: [activity: [:thread, :categories]]
      )
      |> Repo.all()

    {trace, events}
  end

  def list_user_traces(%User{} = user) do
    from(trace in Trace, where: trace.user_id == ^user.id, order_by: [asc: trace.id])
    |> Repo.all()
  end

  def create_trace(%User{} = user, attrs) do
    Multi.new()
    |> Multi.insert(:trace, Trace.changeset(%Trace{user_id: user.id}, attrs))
    |> Multi.insert(:main_thread, fn %{trace: trace} ->
      Thread.changeset(%Thread{trace_id: trace.id}, %{name: "Main", rank: 0})
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{trace: trace}} -> {:ok, trace}
      {:error, _operation, changeset, _changes} -> {:error, changeset}
    end
  end

  def create_thread(%Trace{} = trace, attrs) do
    %Thread{trace_id: trace.id}
    |> Thread.changeset(attrs)
    |> Repo.insert()
  end

  def update_trace(%Trace{} = trace, attrs) do
    trace
    |> Trace.changeset(attrs)
    |> Repo.update()
  end

  def delete_trace(%Trace{} = trace), do: Repo.delete(trace)

  def get_user_trace_thread!(%User{} = user, trace_id, thread_id) do
    from(thread in Thread,
      join: trace in assoc(thread, :trace),
      where: thread.id == ^thread_id and trace.id == ^trace_id and trace.user_id == ^user.id
    )
    |> Repo.one!()
  end

  def get_user_thread!(%User{} = user, thread_id) do
    from(thread in Thread,
      join: trace in assoc(thread, :trace),
      where: thread.id == ^thread_id and trace.user_id == ^user.id
    )
    |> Repo.one!()
  end

  def update_thread(%Thread{} = thread, attrs) do
    thread
    |> Thread.changeset(attrs)
    |> Repo.update()
  end

  def reorder_threads(%Trace{} = trace, thread_ids) when is_list(thread_ids) do
    ordered_ids = Enum.map(thread_ids, &parse_thread_id/1)
    existing_ids = MapSet.new(Enum.map(trace.threads, & &1.id))

    cond do
      Enum.any?(ordered_ids, &is_nil/1) ->
        {:error, :invalid_thread_ids}

      length(ordered_ids) != MapSet.size(existing_ids) ->
        {:error, :invalid_thread_ids}

      MapSet.new(ordered_ids) != existing_ids ->
        {:error, :invalid_thread_ids}

      true ->
        now = DateTime.utc_now() |> DateTime.truncate(:second)

        ordered_ids
        |> Enum.with_index()
        |> Enum.reduce(Multi.new(), fn {id, rank}, multi ->
          Multi.update_all(
            multi,
            {:thread, id},
            from(thread in Thread, where: thread.id == ^id and thread.trace_id == ^trace.id),
            set: [rank: rank, updated_at: now]
          )
        end)
        |> Repo.transaction()
        |> case do
          {:ok, _changes} -> {:ok, get_trace!(trace.id)}
          {:error, _operation, _changeset, _changes} -> {:error, :invalid_thread_ids}
        end
    end
  end

  def reorder_threads(%Trace{}, _thread_ids), do: {:error, :invalid_thread_ids}

  def delete_thread(%Thread{} = thread), do: Repo.delete(thread)

  defp parse_thread_id(id) when is_integer(id) and id > 0, do: id

  defp parse_thread_id(id) when is_binary(id) do
    case Integer.parse(id) do
      {parsed, ""} when parsed > 0 -> parsed
      _ -> nil
    end
  end

  defp parse_thread_id(_id), do: nil

  def get_user_trace_activity!(%User{} = user, trace_id, activity_id) do
    from(activity in Activity,
      join: thread in assoc(activity, :thread),
      join: trace in assoc(thread, :trace),
      where: activity.id == ^activity_id and trace.id == ^trace_id and trace.user_id == ^user.id,
      preload: [thread: thread]
    )
    |> Repo.one!()
  end

  def get_user_trace_thread_activity(%User{} = user, trace_id, thread_id, activity_id) do
    from(activity in Activity,
      join: thread in assoc(activity, :thread),
      join: trace in assoc(thread, :trace),
      where:
        activity.id == ^activity_id and thread.id == ^thread_id and trace.id == ^trace_id and
          trace.user_id == ^user.id
    )
    |> Repo.one()
  end

  def get_user_activity!(%User{} = user, activity_id) do
    from(activity in Activity,
      join: thread in assoc(activity, :thread),
      join: trace in assoc(thread, :trace),
      where: activity.id == ^activity_id and trace.user_id == ^user.id,
      preload: [:categories]
    )
    |> Repo.one!()
  end

  def get_user_event!(%User{} = user, event_id) do
    from(event in Event,
      join: trace in assoc(event, :trace),
      where: event.id == ^event_id and trace.user_id == ^user.id
    )
    |> Repo.one!()
  end

  def get_user_activities(%User{} = user, ids) when is_list(ids) do
    activities =
      from(activity in Activity,
        join: thread in assoc(activity, :thread),
        join: trace in assoc(thread, :trace),
        where: activity.id in ^ids and trace.user_id == ^user.id
      )
      |> Repo.all()

    if length(activities) == length(Enum.uniq(ids)),
      do: {:ok, activities},
      else: {:error, :not_found}
  end

  def create_activity(
        %Trace{} = trace,
        %Thread{} = thread,
        parent,
        activity_attrs,
        event_attrs,
        categories \\ []
      ) do
    Multi.new()
    |> Multi.insert(
      :activity,
      Activity.changeset(
        %Activity{thread_id: thread.id, parent_id: parent && parent.id},
        activity_attrs
      )
      |> Ecto.Changeset.put_assoc(:categories, categories)
    )
    |> Multi.insert(:event, fn %{activity: activity} ->
      Event.changeset(%Event{trace_id: trace.id, activity_id: activity.id}, event_attrs)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{activity: activity, event: event}} -> {:ok, activity, event}
      {:error, _operation, changeset, _changes} -> {:error, changeset}
    end
  end

  def create_event(%Trace{} = trace, %Activity{} = activity, attrs) do
    %Event{trace_id: trace.id, activity_id: activity.id}
    |> Event.changeset(attrs)
    |> Repo.insert()
  end

  def update_activity(%Activity{} = activity, attrs, categories) do
    activity
    |> Activity.changeset(attrs)
    |> Ecto.Changeset.put_assoc(:categories, categories)
    |> Repo.update()
  end

  @doc """
  Move an activity onto another thread in the same trace.

  When `move_child_ids` is omitted, the entire descendant subtree moves (legacy).
  When `move_child_ids` is a list (including `[]`), only those **direct** children
  and each of their subtrees move with the root; other direct children stay and
  are reparented to the nearest ancestor that remained on the source thread
  (`parent_id` cleared if there is none).

  Parent links among the moved set are preserved. If the moved root's parent
  stays on the source thread, the moved root's `parent_id` is cleared (ADR-002).
  """
  def move_activity_subtree(
        %User{} = user,
        %Activity{} = activity,
        thread_id,
        move_child_ids \\ :all
      ) do
    activity = Repo.preload(activity, :thread)

    with {:ok, thread} <- same_trace_thread(user, activity, thread_id),
         {:ok, ids, stay_child_ids} <- move_ids_for(activity, move_child_ids) do
      if thread.id == activity.thread_id do
        {:ok, activity}
      else
        now = DateTime.utc_now() |> DateTime.truncate(:second)

        {_, _} =
          from(a in Activity, where: a.id in ^ids)
          |> Repo.update_all(set: [thread_id: thread.id, updated_at: now])

        # Detach from a parent that did not move with this subtree.
        if activity.parent_id && activity.parent_id not in ids do
          from(a in Activity, where: a.id == ^activity.id)
          |> Repo.update_all(set: [parent_id: nil, updated_at: now])
        end

        # Direct children left behind attach to the remaining same-thread ancestor.
        if stay_child_ids != [] do
          from(a in Activity, where: a.id in ^stay_child_ids)
          |> Repo.update_all(
            set: [parent_id: remaining_same_thread_parent(activity), updated_at: now]
          )
        end

        {:ok, get_user_activity!(user, activity.id)}
      end
    end
  end

  defp move_ids_for(%Activity{id: root_id}, :all) do
    {:ok, subtree_activity_ids(root_id), []}
  end

  defp move_ids_for(%Activity{id: root_id}, child_ids) when is_list(child_ids) do
    direct_ids =
      from(a in Activity, where: a.parent_id == ^root_id, select: a.id)
      |> Repo.all()
      |> MapSet.new()

    requested =
      child_ids
      |> Enum.map(&normalize_id/1)
      |> Enum.reject(&is_nil/1)
      |> Enum.uniq()

    if Enum.any?(requested, &(&1 not in direct_ids)) do
      {:error, :not_found}
    else
      selected = MapSet.new(requested)
      stay = MapSet.difference(direct_ids, selected) |> MapSet.to_list()

      ids =
        [root_id | Enum.flat_map(requested, &subtree_activity_ids/1)]
        |> Enum.uniq()

      {:ok, ids, stay}
    end
  end

  defp move_ids_for(_activity, _), do: {:error, :not_found}

  defp remaining_same_thread_parent(%Activity{parent_id: nil}), do: nil

  defp remaining_same_thread_parent(%Activity{parent_id: parent_id, thread_id: source_thread_id}) do
    remaining_same_thread_parent(parent_id, source_thread_id, MapSet.new())
  end

  defp remaining_same_thread_parent(nil, _source_thread_id, _seen), do: nil

  defp remaining_same_thread_parent(parent_id, source_thread_id, seen) do
    if parent_id in seen do
      nil
    else
      case Repo.get(Activity, parent_id) do
        %Activity{id: id, thread_id: ^source_thread_id} ->
          id

        %Activity{id: id, parent_id: next_id} ->
          remaining_same_thread_parent(next_id, source_thread_id, MapSet.put(seen, id))

        _ ->
          nil
      end
    end
  end

  @doc """
  Clear `parent_id` on any activity whose parent lives on a different thread.
  Repairs forests broken before move-detach was enforced (ADR-002).
  """
  def detach_cross_thread_parents do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    from(a in Activity,
      join: parent in Activity,
      on: a.parent_id == parent.id,
      where: a.thread_id != parent.thread_id
    )
    |> Repo.update_all(set: [parent_id: nil, updated_at: now])
  end

  defp same_trace_thread(
         %User{} = user,
         %Activity{thread: %Thread{trace_id: trace_id}},
         thread_id
       ) do
    thread_id = normalize_id(thread_id)

    case thread_id && get_user_trace_thread(user, trace_id, thread_id) do
      %Thread{} = thread -> {:ok, thread}
      _ -> {:error, :not_found}
    end
  end

  defp get_user_trace_thread(%User{} = user, trace_id, thread_id) do
    from(thread in Thread,
      join: trace in assoc(thread, :trace),
      where: thread.id == ^thread_id and trace.id == ^trace_id and trace.user_id == ^user.id
    )
    |> Repo.one()
  end

  defp normalize_id(id) when is_integer(id) and id > 0, do: id

  defp normalize_id(id) when is_binary(id) do
    case Integer.parse(id) do
      {parsed, ""} when parsed > 0 -> parsed
      _ -> nil
    end
  end

  defp normalize_id(_), do: nil

  defp subtree_activity_ids(root_id) do
    child_ids =
      from(a in Activity, where: a.parent_id == ^root_id, select: a.id)
      |> Repo.all()

    [root_id | Enum.flat_map(child_ids, &subtree_activity_ids/1)]
  end

  def delete_activity(%Activity{} = activity), do: Repo.delete(activity)

  def update_event(%Event{} = event, attrs) do
    event
    |> Event.changeset(attrs)
    |> Repo.update()
  end

  def delete_event(%Event{} = event), do: Repo.delete(event)
end
