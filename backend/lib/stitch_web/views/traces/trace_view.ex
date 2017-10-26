defmodule StitchWeb.TraceView do
  use StitchWeb, :view
  alias StitchWeb.TraceView

  def render("index.json", %{traces: traces}) do
    %{data: render_many(traces, TraceView, "trace.json")}
  end

  def render("show.json", %{trace: trace}) do
    %{data: render_one(trace, TraceView, "trace.json")}
  end

  def render("trace.json", %{trace: trace}) do
    %{id: trace.id,
      name: trace.name}
  end
end
