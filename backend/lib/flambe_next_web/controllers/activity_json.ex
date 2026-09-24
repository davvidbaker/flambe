defmodule FlambeNextWeb.ActivityJSON do
  alias FlambeNext.Traces.Activity

  def show(%{activity: %Activity{} = activity, event: event} = assigns) do
    data = %{activity: activity_data(activity), event: event_data(event)}

    case Map.get(assigns, :reducer) do
      nil -> %{data: data}
      notes -> %{data: Map.put(data, :reducer, notes)}
    end
  end

  def show(%{activity: %Activity{} = activity}) do
    %{data: activity_data(activity)}
  end

  defp activity_data(activity) do
    %{
      id: activity.id,
      name: activity.name,
      description: activity.description,
      weight: activity.weight,
      parent_id: activity.parent_id,
      thread_id: activity.thread_id,
      agent_id: activity.agent_id,
      agent_name: activity.agent_name,
      scheduled_start: millis(activity.scheduled_start),
      scheduled_end: millis(activity.scheduled_end),
      proposed_by_agent_id: activity.proposed_by_agent_id,
      proposed_by_agent_name: activity.proposed_by_agent_name
    }
  end

  defp event_data(nil), do: nil
  defp event_data(event), do: %{id: event.id, phase: event.phase}

  defp millis(nil), do: nil
  defp millis(%DateTime{} = datetime), do: DateTime.to_unix(datetime, :millisecond)
end
