defmodule SteadyWeb.TraceView do
  use SteadyWeb, :view
  alias SteadyWeb.TraceView

  def render("index.json", %{traces: traces}) do
    %{data: render_many(traces, TraceView, "trace.json")}
  end

  def render("show.json", %{events: events, trace: trace}) do
    %{data: render_one(%{events: events, trace: trace}, TraceView, "trace.json")}
  end

  # ⚠️ things are getting a little messy. trace is a map that has keys [:events, :trace]
  def render("trace.json", %{trace: trace}) do
    threads = Enum.map(trace.trace.threads, fn x -> %{id: x.id, name: x.name, rank: x.rank} end)

    events =
      Enum.map(trace.events, fn evt ->
        %{
          timestamp: evt.timestamp,
          phase: evt.phase,
          id: evt.id,
          message: evt.message,
          activity:
            if !is_nil(evt.activity) do
              %{
                name: evt.activity.name,
                id: evt.activity.id,
                thread: %{id: evt.activity.thread_id},
                categories: Enum.map(evt.activity.categories, fn cat -> cat.id end)
              }
            else
              nil
            end
        }
      end)

    #             id: evt_in.activity.id,
    #             # ⚠️ add categories back in
    #             thread: %{
    #               id: evt_in.activity.thread_id
    #             },
    #             categories: Enum.map(evt_in.activity.categories, fn cat -> cat.id end)
    #           })

    %{
      id: trace.trace.id,
      threads: threads,
      name: trace.trace.name,
      events: events
    }
  end

  def render("trace.json", %{trace: trace, events: events}) do
    # ⚠️ idk if this is the right place to be doing this
    %{threads: threads} = Steady.Repo.preload(trace, :threads)

    threads = Enum.map(threads, fn x -> %{id: x.id, name: x.name, rank: x.rank} end)

    # 💁 trace.events will only not be loaded if the trace was just created, in which case it will have no events.
    # events = case Ecto.assoc_loaded?(trace.events) do
    #   true ->
    #     Enum.map(trace.events, fn evt_in ->
    #       evt_in = Steady.Repo.preload(evt_in, [activity: [:categories]])
    #       evt_out = %{
    #         timestamp: evt_in.timestamp,
    #         phase: evt_in.phase,
    #         id: evt_in.id,
    #         message: evt_in.message
    #       }
    #       evt_out = case is_nil evt_in.activity do
    #         true -> evt_out
    #         false -> Map.put(
    #           evt_out,
    #           :activity,
    #            %{
    #             name: evt_in.activity.name,
    #             id: evt_in.activity.id,
    #             # ⚠️ add categories back in
    #             thread: %{
    #               id: evt_in.activity.thread_id
    #             },
    #             categories: Enum.map(evt_in.activity.categories, fn cat -> cat.id end)
    #           })
    #       end
    #     end)

    #     false -> []
    #   end

    %{
      id: trace.id,
      name: trace.name,
      events: events,
      threads: threads
    }
  end
end
