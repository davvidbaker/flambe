defmodule SteadyWeb.ActivityView do
  use SteadyWeb, :view
  alias SteadyWeb.{ActivityView, EventView}

  # def render("index.json", %{traces: traces}) do
  #   %{data: render_many(traces, EventView, "trace.json")}
  # end

  def render("show.json", %{activity: activity, event: event}) do
    %{
      data: %{
        activity: render_one(activity, ActivityView, "activity.json"),
        event: render_one(event, EventView, "event.json")
      }
    }
  end

  def render("show.json", %{activity: activity}) do
    %{
      activity: render_one(activity, ActivityView, "activity.json")
    }
  end

  def render("activity.json", %{activity: activity}) do
    %{
      id: activity.id,
      name: activity.name,
      description: activity.description
    }
  end
end
