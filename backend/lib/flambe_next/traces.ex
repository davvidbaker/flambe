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

  def delete_thread(%Thread{} = thread), do: Repo.delete(thread)

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

  def delete_activity(%Activity{} = activity), do: Repo.delete(activity)

  def update_event(%Event{} = event, attrs) do
    event
    |> Event.changeset(attrs)
    |> Repo.update()
  end

  def delete_event(%Event{} = event), do: Repo.delete(event)
end
