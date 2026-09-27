defmodule FlambeNextWeb.TraceJSON do
  alias FlambeNext.Traces.{Activity, Event, Trace}

  def index(%{traces: traces}) do
    %{data: Enum.map(traces, &summary_data/1)}
  end

  def show(%{trace: %Trace{} = trace, events: events} = assigns) do
    payload = data(trace, events)

    payload =
      case Map.get(assigns, :unstarted) do
        unstarted when is_list(unstarted) ->
          Map.put(payload, :unstarted, Enum.map(unstarted, &activity_data/1))

        _ ->
          payload
      end

    %{data: payload}
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
      agent_id: activity.agent_id,
      agent_name: activity.agent_name,
      parent_id: activity.parent_id,
      thread: %{id: activity.thread_id},
      categories: Enum.map(activity.categories, & &1.id),
      weight: activity.weight,
      description: activity.description,
      scheduled_start: millis(activity.scheduled_start),
      scheduled_end: millis(activity.scheduled_end),
      proposed_by_agent_id: activity.proposed_by_agent_id,
      proposed_by_agent_name: activity.proposed_by_agent_name
    }
  end

  defp thread_data(thread) do
    %{id: thread.id, name: thread.name, rank: thread.rank}
  end

  defp summary_data(trace), do: %{id: trace.id, name: trace.name}

  defp millis(nil), do: nil
  defp millis(%DateTime{} = datetime), do: DateTime.to_unix(datetime, :millisecond)
end
