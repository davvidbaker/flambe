defmodule Flambe.Traces do
  @moduledoc """
  The Traces context.
  """

  import Ecto.Query, warn: false
  alias Flambe.Repo

  alias Flambe.Traces.{Trace, Activity, Thread, Event}
  alias Flambe.Accounts.User

  @doc """
  Returns the list of traces.

  ## Examples

      iex> list_traces()
      [%Trace{}, ...]

  """
  def list_traces do
    Repo.all(Trace)
  end

  @doc """
  Returns the list of traces for a particular user.

  ## Examples

      iex> list_user_traces(%User{})
      [%{id: integer, name: "my trace"}, ...]

  """
  def list_user_traces(%User{id: user_id}) do
    query =
      from(
        trace in Trace,
        where: trace.user_id == ^user_id,
        select: trace
      )

    Repo.all(query)
  end

  @doc """
  Returns the list of events for a particular trace.

  ## Examples

      iex> list_trace_events(%Trace{})
      [%Event{}, ...]

  """
  def list_trace_events(%Trace{} = trace) do
    query =
      from(
        event in Event,
        where: event.trace_id == ^trace.id
      )

    Repo.all(query)
  end

  # ⚠️ needs doc
  def list_trace_threads(%Trace{} = trace) do
    query =
      from(
        thread in Thread,
        where: thread.trace_id == ^trace.id
      )

    Repo.all(query)
  end

  @doc """
  Gets a single trace.

  Raises `Ecto.NoResultsError` if the Trace does not exist.

  ## Examples

      iex> get_trace!(123)
      %Trace{}

      iex> get_trace!(456)
      ** (Ecto.NoResultsError)

  """
  def get_trace!(id) do
    Trace
    |> Repo.get!(id)
    |> Repo.preload(:threads)
  end

  @spec get_trace_with_events(any()) ::
          {any(),
           nil
           | [%{:__struct__ => atom(), optional(atom()) => any()}]
           | %{:__struct__ => atom(), optional(atom()) => any()}}
  def get_trace_with_events(id) do
    query =
      from(e in Flambe.Traces.Event, where: e.trace_id == ^id, preload: [activity: :categories])

    events = Repo.all(query)

    trace = get_trace!(id)

    {events, trace}
  end

  # 💁 A trace **always** comes with a Main thread
  def create_trace(%User{} = user, attrs \\ %{}) do
    with {:ok, trace} <-
           %Trace{}
           |> Trace.changeset(attrs)
           |> Ecto.Changeset.put_change(:user, user)
           |> Repo.insert(),
         {:ok, _thread} <- create_thread(trace, %{name: "Main"}) do
      {:ok, trace}
    end
  end

  @doc """
  Updates a trace.

  ## Examples

      iex> update_trace(trace, %{field: new_value})
      {:ok, %Trace{}}

      iex> update_trace(trace, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_trace(%Trace{} = trace, attrs) do
    trace
    |> Trace.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Trace.

  ## Examples

      iex> delete_trace(trace)
      {:ok, %Trace{}}

      iex> delete_trace(trace)
      {:error, %Ecto.Changeset{}}

  """
  def delete_trace(%Trace{} = trace) do
    Repo.delete(trace)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking trace changes.

  ## Examples

      iex> change_trace(trace)
      %Ecto.Changeset{source: %Trace{}}

  """
  def change_trace(%Trace{} = trace) do
    Trace.changeset(trace, %{})
  end

  alias Flambe.Traces.Event

  @doc """
  Returns the list of events.

  ## Examples

      iex> list_events()
      [%Event{}, ...]

  """
  def list_events do
    Repo.all(Event)
  end

  @doc """
  Gets a single event.

  Raises `Ecto.NoResultsError` if the Event does not exist.

  ## Examples

      iex> get_event!(123)
      %Event{}

      iex> get_event!(456)
      ** (Ecto.NoResultsError)

  """
  def get_event!(id), do: Repo.get!(Event, id)

  @doc """
  Creates an event that is tied to a particular activity.

  ## Examples

      iex> create_event(%{field: value})
      {:ok, %Event{}}

      iex> create_event(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  #   ⚠️ need to do validation on trace_id and activity_id
  def create_event(%Trace{} = trace, %Activity{} = activity, attrs) do
    %Event{}
    |> Event.changeset(attrs)
    |> Ecto.Changeset.put_assoc(:trace, trace)
    |> Ecto.Changeset.put_assoc(:activity, activity)
    |> Repo.insert()
  end

  @doc """
  Updates a event.

  ## Examples

      iex> update_event(event, %{field: new_value})
      {:ok, %Event{}}

      iex> update_event(event, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_event(%Event{} = event, attrs) do
    event
    |> Event.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Event.

  ## Examples

      iex> delete_event(event)
      {:ok, %Event{}}

      iex> delete_event(event)
      {:error, %Ecto.Changeset{}}

  """
  def delete_event(%Event{} = event) do
    Repo.delete(event)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking event changes.

  ## Examples

      iex> change_event(event)
      %Ecto.Changeset{source: %Event{}}

  """
  def change_event(%Event{} = event) do
    Event.changeset(event, %{})
  end

  alias Flambe.Traces.Activity

  @doc """
  Returns the list of activities.

  ## Examples

      iex> list_activities()
      [%Activity{}, ...]

  """
  def list_activities do
    Repo.all(Activity)
  end

  @doc """
  Gets a single activity.

  Raises `Ecto.NoResultsError` if the Activity does not exist.

  ## Examples

      iex> get_activity!(123)
      %Activity{}

      iex> get_activity!(456)
      ** (Ecto.NoResultsError)

  """
  def get_activity!(id), do: Repo.get!(Activity, id)

  def get_activity_with_events(id) do
    Repo.get!(Activity, id) |> Repo.preload(:events)
  end

  # 💁 an activity always comes with at least one event
  def create_activity(thread, attrs, event_attrs) do
    trace = get_trace!(thread.trace_id)

    IO.puts "\n🔥 trace"
    IO.inspect trace

    with {:ok, %Activity{} = activity} <-
           %Activity{}
           |> Activity.changeset(attrs)
           |> Ecto.Changeset.put_assoc(:thread, thread)
           |> Repo.insert(),
         {:ok, %Event{} = event} <- create_event(trace, activity, event_attrs) do
      {:ok, activity, event}
    end
  end

  def update_activity(%Activity{} = activity, %{thread: %Thread{} = thread} = attrs) do
    activity
    |> Activity.changeset(Map.put(attrs, :thread_id, thread.id))
    |> Repo.update()
  end

  def update_activity(%Activity{} = activity, attrs) do
    IO.puts("\n🔥 this should not show attrs")
    IO.inspect(attrs)

    activity
    |> Activity.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Activity.

  ## Examples

      iex> delete_activity(activity)
      {:ok, %Activity{}}

      iex> delete_activity(activity)
      {:error, %Ecto.Changeset{}}

  """
  def delete_activity(%Activity{} = activity) do
    Repo.delete(activity)
  end

  alias Flambe.Traces.Thread

  @doc """
  Returns the list of threads.

  ## Examples

      iex> list_threads()
      [%Thread{}, ...]

  """
  def list_threads do
    Repo.all(Thread)
  end

  @doc """
  Gets a single thread.

  Raises `Ecto.NoResultsError` if the Thread does not exist.

  ## Examples

      iex> get_thread!(123)
      %Thread{}

      iex> get_thread!(456)
      ** (Ecto.NoResultsError)

  """
  def get_thread!(id), do: Repo.get!(Thread, id)

  @doc """
  Creates a thread.

  ## Examples

      iex> create_thread(%{field: value})
      {:ok, %Thread{}}

      iex> create_thread(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_thread(trace, attrs \\ %{}) do
    %Thread{}
    |> Thread.changeset(attrs)
    |> Ecto.Changeset.put_assoc(:trace, trace)
    |> Repo.insert()
  end

  @doc """
  Updates a thread.

  ## Examples

      iex> update_thread(thread, %{field: new_value})
      {:ok, %Thread{}}

      iex> update_thread(thread, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_thread(%Thread{} = thread, attrs) do
    thread
    |> Thread.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Thread.

  ## Examples

      iex> delete_thread(thread)
      {:ok, %Thread{}}

      iex> delete_thread(thread)
      {:error, %Ecto.Changeset{}}

  """
  def delete_thread(%Thread{} = thread) do
    Repo.delete(thread)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking thread changes.

  ## Examples

      iex> change_thread(thread)
      %Ecto.Changeset{source: %Thread{}}

  """
  def change_thread(%Thread{} = thread) do
    Thread.changeset(thread, %{})
  end

  def list_thread_activities(%Thread{} = thread) do
    query =
      from(
        a in Activity,
        where: a.thread_id == ^thread.id
      )

    Repo.all(query)
  end

end
