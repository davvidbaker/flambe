defmodule FlambeNextWeb.ActivityJSON do
  alias FlambeNext.Traces.Activity

  def show(%{activity: %Activity{} = activity, event: event}) do
    %{data: %{activity: activity_data(activity), event: event_data(event)}}
  end

  defp activity_data(activity) do
    %{
      id: activity.id,
      name: activity.name,
      description: activity.description,
      weight: activity.weight
    }
  end

  defp event_data(event), do: %{id: event.id, phase: event.phase}
end
