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

    threads = Enum.map(threads, fn x -> %{id: x.id, name: x.name, rank: x.rank} end)
    
    # 💁 trace.events will only not be loaded if the trace was just created, in which case it will have no events.
    events = case Ecto.assoc_loaded?(trace.events) do
      true -> 
        Enum.map(trace.events, fn evt_in ->
          evt_in = Stitch.Repo.preload(evt_in, [activity: [:categories]])
          evt_out = %{
            timestamp: evt_in.timestamp,
            phase: evt_in.phase, 
            id: evt_in.id,
          }
          IO.puts "😃"
          IO.inspect Map.keys(evt_in)
          IO.inspect Map.has_key?(evt_in, :activity)
          evt_out = case is_nil evt_in.activity do
            true -> evt_out
            false -> Map.put(
              evt_out,
              :activity,
               %{
                name: evt_in.activity.name,
                id: evt_in.activity.id,
                # ⚠️ add categories back in 
                thread: %{
                  id: evt_in.activity.thread_id
                },
                categories: Enum.map(evt_in.activity.categories, fn cat -> cat.id end)
              })
          end
          IO.inspect evt_out
        end)
        
        
        false -> []
      end

    IO.inspect events

    %{id: trace.id,
      name: trace.name,
      events: events,
      threads: threads
    }
  end
end
