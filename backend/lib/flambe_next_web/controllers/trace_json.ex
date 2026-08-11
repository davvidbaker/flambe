defmodule FlambeNextWeb.TraceJSON do
  alias FlambeNext.Traces.{Activity, Event, Trace}

  def index(%{traces: traces}) do
    %{data: Enum.map(traces, &summary_data/1)}
  end

  def show(%{trace: %Trace{} = trace, events: events}) do
    %{data: data(trace, events)}
  end

  def show(%{trace: %Trace{} = trace}) do
    %{data: data(trace, [])}
  end

  defp data(trace, events) do
    %{
      id: trace.id,
      name: trace.name,
      events: Enum.map(events, &event_data/1),
      threads: Enum.map(trace.threads, &thread_data/1)
    }
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
      thread: %{id: activity.thread_id},
      categories: Enum.map(activity.categories, & &1.id),
      weight: activity.weight
    }
  end

  defp thread_data(thread) do
    %{id: thread.id, name: thread.name, rank: thread.rank}
  end

  defp summary_data(trace), do: %{id: trace.id, name: trace.name}
end
