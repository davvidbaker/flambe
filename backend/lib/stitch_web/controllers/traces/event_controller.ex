defmodule StitchWeb.EventController do
  use StitchWeb, :controller

  alias Stitch.Traces
  alias Stitch.Traces.{Event, Trace}

  action_fallback StitchWeb.FallbackController

  def create(conn, %{"event" => event_params}) do
    trace = 
      event_params["trace_id"]
      |> Traces.get_trace!()
    
    # ⚠️ 🔒 this is bad. Should rely on the connection or token for authentication
    with {:ok, %Event{} = event} <- Traces.create_event(trace, event_params) do
      # with {:ok, %Trace{} = trace} <- Traces.create_trace(conn.assigns.current_user, trace_params) do
      conn
      |> put_status(:created)
      |> render("show.json", event: event)
    end
  end
end
