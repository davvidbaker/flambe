defmodule StitchWeb.ActivityView do
  use StitchWeb, :view
  alias StitchWeb.ActivityView

  # def render("index.json", %{traces: traces}) do
  #   %{data: render_many(traces, EventView, "trace.json")}
  # end

  def render("show.json", %{activity: activity}) do
    %{data: render_one(activity, ActivityView, "activity.json")}
  end

  def render("activity.json", %{activity: activity}) do
    %{
      id: activity.id,
      name: activity.name,
      description: activity.description
    }
  end
end
