defmodule FlambeNextWeb.EventStream do
  @moduledoc false

  alias FlambeNext.Accounts.User
  alias FlambeNext.Repo
  alias FlambeNext.Traces.{Activity, Event}
  alias FlambeNextWeb.Endpoint

  def broadcast_event(%User{id: user_id}, %Event{} = event) do
    event = Repo.preload(event, activity: [:thread, :categories])

    Endpoint.broadcast("events:#{user_id}", "timeline_event", %{
      trace_id: event.trace_id,
      event: event_data(event)
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
      thread: %{id: activity.thread_id},
      categories: Enum.map(activity.categories, & &1.id),
      weight: activity.weight
    }
  end
end
