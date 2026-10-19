defmodule FlambeNext.Traces.CreationHistory do
  @moduledoc "Reciprocal, signed restoration of created activities and lifecycle events."
  import Ecto.Query
  alias FlambeNext.{Repo, Traces}
  alias FlambeNext.Traces.{Activity, Event}
  alias FlambeNextWeb.Endpoint
  @salt "creation-history-v1"

  def reverse(user, trace_id, %{"token" => token}) when is_binary(token) do
    trace = Traces.get_user_trace!(user, trace_id)

    with {:ok, %{user_id: owner, trace_id: saved_trace} = record} <-
           Phoenix.Token.verify(Endpoint, @salt, token, max_age: :infinity),
         true <- owner == user.id and saved_trace == trace.id do
      transaction(fn ->
        apply_record(record)
        sign(user.id, trace.id, flip(record.mode), record.snapshot)
      end)
    else
      _ -> {:error, :invalid}
    end
  end

  def reverse(user, trace_id, %{"kind" => kind, "target_id" => id} = params)
      when kind in ["activity", "event"] and (is_integer(id) or is_binary(id)) do
    trace = Traces.get_user_trace!(user, trace_id)

    transaction(fn ->
      snapshot = capture(kind, id, trace.id, params)
      apply_record(%{mode: :remove, snapshot: snapshot})
      sign(user.id, trace.id, :restore, snapshot)
    end)
  end

  def reverse(_user, _trace, _params), do: {:error, :invalid}

  defp transaction(fun) do
    Repo.transaction(fun)
  rescue
    _ in [
      Ecto.ConstraintError,
      Ecto.InvalidChangesetError,
      Ecto.StaleEntryError,
      Ecto.Query.CastError
    ] ->
      {:error, :conflict}
  end

  defp capture("activity", id, trace_id, _params) do
    activity =
      from(a in Activity,
        join: t in assoc(a, :thread),
        where: a.id == ^id and t.trace_id == ^trace_id,
        lock: "FOR UPDATE"
      )
      |> Repo.one()

    if activity == nil, do: Repo.rollback(:conflict)

    %{
      kind: :activity,
      activity: fields(activity),
      events:
        from(e in Event, where: e.activity_id == ^activity.id, order_by: e.id)
        |> Repo.all()
        |> Enum.map(&fields/1),
      categories: categories(activity.id),
      children: children(activity.id)
    }
  end

  defp capture("event", id, trace_id, params) do
    event =
      from(e in Event, where: e.id == ^id and e.trace_id == ^trace_id, lock: "FOR UPDATE")
      |> Repo.one()

    if event == nil, do: Repo.rollback(:conflict)

    weight =
      case params["restore_weight"] do
        nil ->
          nil

        %{"activity_id" => activity_id, "weight" => old}
        when (is_integer(old) or is_nil(old)) and
               (is_integer(activity_id) or is_binary(activity_id)) ->
          if to_string(activity_id) != to_string(event.activity_id), do: Repo.rollback(:invalid)
          activity = Repo.get!(Activity, event.activity_id)
          %{activity_id: activity.id, before: activity.weight, after: old}

        _ ->
          Repo.rollback(:invalid)
      end

    %{kind: :event, event: fields(event), weight: weight}
  end

  defp apply_record(%{mode: :remove, snapshot: %{kind: :activity} = snapshot}) do
    expected = snapshot.activity
    current = capture("activity", expected.id, activity_trace(expected.thread_id), %{})
    if current != snapshot, do: Repo.rollback(:conflict)
    Repo.delete!(Repo.get!(Activity, expected.id))
  end

  defp apply_record(%{mode: :restore, snapshot: %{kind: :activity} = snapshot}) do
    activity = snapshot.activity
    if Repo.get(Activity, activity.id), do: Repo.rollback(:conflict)

    if activity.parent_id do
      parent = Repo.get(Activity, activity.parent_id)
      if parent == nil or parent.thread_id != activity.thread_id, do: Repo.rollback(:conflict)
    end

    Enum.each(snapshot.children, fn child ->
      current = Repo.get(Activity, child.id)

      if current == nil or current.parent_id != nil or current.thread_id != child.thread_id,
        do: Repo.rollback(:conflict)
    end)

    if Enum.any?(snapshot.events, &Repo.get(Event, &1.id)), do: Repo.rollback(:conflict)
    Repo.insert!(struct(Activity, activity))
    Enum.each(snapshot.events, &Repo.insert!(struct(Event, &1)))

    if snapshot.categories != [] do
      count =
        Repo.aggregate(
          from(c in FlambeNext.Accounts.Category, where: c.id in ^snapshot.categories),
          :count
        )

      if count != length(snapshot.categories), do: Repo.rollback(:conflict)

      Repo.insert_all(
        "activities_categories",
        Enum.map(snapshot.categories, &%{activity_id: activity.id, category_id: &1})
      )
    end

    Enum.each(snapshot.children, fn child ->
      from(a in Activity, where: a.id == ^child.id)
      |> Repo.update_all(set: [parent_id: activity.id])
    end)
  end

  defp apply_record(%{mode: mode, snapshot: %{kind: :event} = snapshot}) do
    event = snapshot.event
    current = Repo.get(Event, event.id)

    case mode do
      :remove ->
        if current == nil or fields(current) != event, do: Repo.rollback(:conflict)

      :restore ->
        if current != nil, do: Repo.rollback(:conflict)
    end

    if snapshot.weight do
      weight = snapshot.weight

      activity =
        from(a in Activity, where: a.id == ^weight.activity_id, lock: "FOR UPDATE") |> Repo.one()

      expected = if mode == :remove, do: weight.before, else: weight.after
      replacement = if mode == :remove, do: weight.after, else: weight.before
      if activity == nil or activity.weight != expected, do: Repo.rollback(:conflict)

      from(a in Activity, where: a.id == ^activity.id)
      |> Repo.update_all(set: [weight: replacement])
    end

    if mode == :remove, do: Repo.delete!(current), else: Repo.insert!(struct(Event, event))
  end

  defp fields(%module{} = record), do: Map.take(record, module.__schema__(:fields))

  defp categories(id) do
    Repo.all(
      from(c in "activities_categories",
        where: c.activity_id == ^id,
        order_by: c.category_id,
        select: c.category_id
      )
    )
  end

  defp children(id) do
    Repo.all(
      from(a in Activity,
        where: a.parent_id == ^id,
        order_by: a.id,
        select: %{id: a.id, parent_id: a.parent_id, thread_id: a.thread_id}
      )
    )
  end

  defp activity_trace(thread_id), do: Repo.get!(FlambeNext.Traces.Thread, thread_id).trace_id
  defp flip(:remove), do: :restore
  defp flip(:restore), do: :remove

  defp sign(user_id, trace_id, mode, snapshot) do
    Phoenix.Token.sign(Endpoint, @salt, %{
      user_id: user_id,
      trace_id: trace_id,
      mode: mode,
      snapshot: snapshot
    })
  end
end
