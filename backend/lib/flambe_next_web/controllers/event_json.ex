defmodule FlambeNextWeb.EventJSON do
  alias FlambeNext.Traces.Event

  def show(%{event: %Event{} = event} = assigns) do
    data = %{id: event.id, phase: event.phase}

    case Map.get(assigns, :closed_descendants, []) do
      [] ->
        %{data: data}

      closed ->
        %{data: Map.put(data, :reducer, %{closed_descendants: Enum.map(closed, &closed/1)})}
    end
  end

  defp closed(%{activity: activity, event: %Event{} = event}) do
    %{activity_id: activity.id, activity_name: activity.name, event_id: event.id}
  end
end
