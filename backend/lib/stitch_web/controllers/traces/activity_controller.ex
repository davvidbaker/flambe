defmodule StitchWeb.ActivityController do
  use StitchWeb, :controller

  alias Stitch.Traces
  alias Stitch.Traces.{Activity, Event, Trace}

  action_fallback StitchWeb.FallbackController

  def create(conn, %{"trace_id" => trace_id, "event" => event_params, "activity" => activity_params}) do
    
    # ⚠️ 🔒 this is bad. Should rely on the connection or token for authentication
    with {:ok, %Activity{} = activity} <- Traces.create_activity(activity_params),
    {:ok, %Event{}} <- Traces.create_event(trace_id, activity.id, Map.put(event_params, "phase", "B")) do
      # with {:ok, %Trace{} = trace} <- Traces.create_trace(conn.assigns.current_user, trace_params) do
      conn
      |> put_status(:created)
      |> render("show.json", activity: activity)
    end
  end
end
