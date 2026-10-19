defmodule FlambeNext.Traces.ActivityMoves do
  @moduledoc "Atomic exact-set moves and authenticated restoration records."
  import Ecto.Query
  alias FlambeNext.{Repo, Traces}
  alias FlambeNext.Traces.Activity
  alias FlambeNextWeb.Endpoint

  @salt "activity-move-undo-v1"

  def move(user, trace_id, ids, thread_id) when is_list(ids) and ids != [] do
    trace = Traces.get_user_trace!(user, trace_id)

    ids =
      Enum.map(ids, fn
        id when is_integer(id) and id > 0 -> Integer.to_string(id)
        id when is_binary(id) -> id
        _ -> "invalid"
      end)
      |> Enum.uniq()

    Repo.transaction(fn ->
      activities = locked_activities(trace.id)
      selected = Enum.filter(activities, &(to_string(&1.id) in ids))
      if length(selected) != length(ids), do: Repo.rollback(:not_found)
      before = snapshot(activities)

      Enum.each(selected, fn activity ->
        # Reload because an earlier move can reparent another selected activity.
        current = Traces.get_user_activity!(user, activity.id)

        case Traces.move_activity_subtree(user, current, thread_id, []) do
          {:ok, _} -> :ok
          {:error, _} -> Repo.rollback(:not_found)
        end
      end)

      # Keep parent links within the explicitly selected set, without moving children implicitly.
      selected_ids = Enum.map(selected, & &1.id)

      Enum.each(selected, fn activity ->
        if activity.parent_id in selected_ids do
          from(a in Activity, where: a.id == ^activity.id)
          |> Repo.update_all(set: [parent_id: activity.parent_id])
        end
      end)

      after_state = snapshot(locked_activities(trace.id))
      changed = Enum.filter(before, fn {id, value} -> after_state[id] != value end) |> Map.new()
      after_changed = Map.take(after_state, Map.keys(changed))

      Phoenix.Token.sign(Endpoint, @salt, %{
        user_id: user.id,
        trace_id: trace.id,
        before: changed,
        after: after_changed
      })
    end)
  end

  def move(_user, _trace_id, _ids, _thread_id), do: {:error, :not_found}

  def undo(user, trace_id, token) when is_binary(token) do
    trace = Traces.get_user_trace!(user, trace_id)

    with {:ok, %{user_id: user_id, trace_id: saved_trace_id} = record} <-
           Phoenix.Token.verify(Endpoint, @salt, token, max_age: :infinity),
         true <- user_id == user.id and saved_trace_id == trace.id do
      Repo.transaction(fn ->
        activities = locked_activities(trace.id)
        current = snapshot(activities)

        if Map.take(current, Map.keys(record.after)) != record.after,
          do: Repo.rollback(:conflict)

        restored = Map.merge(current, record.before)
        # New children attached after the move must not become cross-thread or orphaned.
        changed_ids = Map.keys(record.before)

        Enum.each(restored, fn {id, value} ->
          if (id in changed_ids or value.parent_id in changed_ids) && value.parent_id &&
               (restored[value.parent_id] == nil ||
                  restored[value.parent_id].thread_id != value.thread_id),
             do: Repo.rollback(:conflict)
        end)

        Enum.each(record.before, fn {id, value} ->
          from(a in Activity, where: a.id == ^id)
          |> Repo.update_all(set: [thread_id: value.thread_id, parent_id: value.parent_id])
        end)

        Phoenix.Token.sign(Endpoint, @salt, %{record | before: record.after, after: record.before})
      end)
    else
      _ -> {:error, :invalid_record}
    end
  end

  def undo(_user, _trace_id, _token), do: {:error, :invalid_record}

  defp locked_activities(trace_id) do
    from(a in Activity,
      join: t in assoc(a, :thread),
      where: t.trace_id == ^trace_id,
      order_by: a.id,
      lock: "FOR UPDATE"
    )
    |> Repo.all()
  end

  defp snapshot(activities) do
    Map.new(activities, &{&1.id, %{thread_id: &1.thread_id, parent_id: &1.parent_id}})
  end
end
