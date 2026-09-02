defmodule FlambeNextWeb.EventStream do
  @moduledoc false

  alias FlambeNext.Accounts.User
  alias FlambeNext.Repo
  alias FlambeNext.Traces.{Activity, Event, Thread}
  alias FlambeNextWeb.Endpoint

  def broadcast_event(%User{id: user_id}, %Event{} = event) do
    event = Repo.preload(event, activity: [:thread, :categories])

    Endpoint.broadcast("events:#{user_id}", "timeline_event", %{
      trace_id: event.trace_id,
      event: event_data(event)
    })
  end

  def broadcast_event_deleted(%User{id: user_id}, %Event{} = event) do
    Endpoint.broadcast("events:#{user_id}", "timeline_event_deleted", %{
      trace_id: event.trace_id,
      event_id: event.id
    })
  end

  defp event_data(%Event{} = event) do
    %{
      id: event.id,
      timestamp: event.timestamp,
      phase: event.phase,
      message: event.message,
      activity: activity_data(event.activity)
    }
  end

  defp activity_data(nil), do: nil

  defp activity_data(%Activity{} = activity) do
    %{
      id: activity.id,
      name: activity.name,
      description: activity.description,
      parent_id: activity.parent_id,
      thread: thread_data(activity.thread),
      categories: Enum.map(activity.categories, & &1.id),
      weight: activity.weight
    }
  end

  defp thread_data(%Thread{} = thread) do
    %{id: thread.id, name: thread.name, rank: thread.rank}
  end
end
