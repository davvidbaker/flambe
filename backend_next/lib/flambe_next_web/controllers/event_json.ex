defmodule FlambeNextWeb.EventJSON do
  alias FlambeNext.Traces.Event

  def show(%{event: %Event{} = event}) do
    %{data: %{id: event.id, phase: event.phase}}
  end
end
