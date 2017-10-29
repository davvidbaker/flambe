defmodule StitchWeb.TraceView do
  use StitchWeb, :view
  alias StitchWeb.TraceView

  def render("index.json", %{traces: traces}) do
    %{data: render_many(traces, TraceView, "trace.json")}
  end

  def render("show.json", %{trace: trace}) do
    # ⚠️ I should flesh this out to make it so when you get the trace, you get all of its events and activities too, right?
    %{data: render_one(trace, TraceView, "trace.json")}
  end

  def render("trace.json", %{trace: trace}) do
    
    # ⚠️ idk if this is the right place to be doing this 
    %{threads: threads} = Stitch.Repo.preload(trace, :threads)
    threads = Enum.map(threads, fn x -> %{id: x.id, name: x.name} end)
    
    # 💁 trace.events will only not be loaded if the trace was just created, in which case it will have no events.
    events = case Ecto.assoc_loaded?(trace.events) do
      true -> trace.events
      false -> []
    end

    %{id: trace.id,
      name: trace.name,
      events: events,
      threads: threads
    }
  end
end
