defmodule Stitch.Traces do
  @moduledoc """
  The Traces context.
  """

  import Ecto.Query, warn: false
  alias Stitch.Repo

  alias Stitch.Traces.{Trace, Activity}
  alias Stitch.Accounts.User

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
  def list_user_traces(%User{} = user) do
    query = from trace in "traces", 
      where: trace.user_id == ^user.id, 
      select: map(trace, [:name, :id])
    Repo.all(query)
  end

  @doc """
  Returns the list of events for a particular trace.

  ## Examples

      iex> list_trace_events(%Trace{})
      [%Event{}, ...]

  """
  def list_trace_events(%{} = trace) do
    query = from event in "events", 
      where: event.trace_id == ^trace.id, 
      select: map(event, [:timestamp, :phase, :message])
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
  def get_trace!(id), do: Repo.get!(Trace, id)

  @doc """
  Creates a trace.

  ## Examples

      iex> create_trace(%{field: value})
      {:ok, %Trace{}}

      iex> create_trace(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_trace(%User{} = user, attrs \\ %{}) do
    %Trace{}
    |> Trace.changeset(attrs)
    |> Ecto.Changeset.put_change(:user, Stitch.Accounts.get_user!(user.id))
    |> Repo.insert()
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

  alias Stitch.Traces.Event

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
  Creates a event.

  ## Examples

      iex> create_event(%{field: value})
      {:ok, %Event{}}

      iex> create_event(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_event(%Trace{} = trace, attrs \\ %{}) do
    %{:id => id} = trace

    %Event{}
    |> Event.changeset(attrs)
    |> Ecto.Changeset.put_change(:trace_id, id)
    |> Repo.insert()
  end

   @doc """
  Creates an event that is tied to a particular activity.

  ## Examples

      iex> create_event(%{field: value})
      {:ok, %Event{}}

      iex> create_event(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_event(%Trace{} = trace, %Activity{} = activity, attrs) do
    %{:id => trace_id} = trace
    %{:id => activity_id} = activity

    IO.puts "in create_event/3"
    IO.inspect attrs
    IO.inspect activity_id

    %Event{}
    |> Event.changeset(attrs)
    |> Ecto.Changeset.put_change(:trace_id, trace_id)
    |> Ecto.Changeset.put_change(:activity_id, activity_id)
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

  alias Stitch.Traces.Activity

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

  @doc """
  Creates a activity.

  ## Examples

      iex> create_activity(%{field: value})
      {:ok, %Activity{}}

      iex> create_activity(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_activity(attrs \\ %{}) do
    %Activity{}
    |> Activity.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a activity.

  ## Examples

      iex> update_activity(activity, %{field: new_value})
      {:ok, %Activity{}}

      iex> update_activity(activity, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_activity(%Activity{} = activity, attrs) do
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

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking activity changes.

  ## Examples

      iex> change_activity(activity)
      %Ecto.Changeset{source: %Activity{}}

  """
  def change_activity(%Activity{} = activity) do
    Activity.changeset(activity, %{})
  end
end
