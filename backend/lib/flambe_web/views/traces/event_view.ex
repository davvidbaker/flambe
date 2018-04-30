defmodule FlambeWeb.EventView do
  use FlambeWeb, :view
  alias FlambeWeb.EventView

  # def render("index.json", %{traces: traces}) do
  #   %{data: render_many(traces, EventView, "trace.json")}
  # end

  def render("show.json", %{event: event}) do
    %{data: render_one(event, EventView, "event.json")}
  end

  def render("event.json", %{event: event}) do
    %{id: event.id, phase: event.phase}
  end
end
