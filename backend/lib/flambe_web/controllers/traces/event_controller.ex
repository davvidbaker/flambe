defmodule FlambeWeb.EventController do
  use FlambeWeb, :controller

  alias Flambe.Traces
  alias Flambe.Traces.{Event, Trace}

  action_fallback(FlambeWeb.FallbackController)

  def create(conn, %{
        "trace_id" => trace_id,
        "activity_id" => activity_id,
        "event" => event_params
      }) do
    with trace <- Traces.get_trace!(trace_id),
         activity <- Traces.get_activity!(activity_id),
         {:ok, %Event{} = event} <- Traces.create_event(trace, activity, event_params) do
      # with {:ok, %Trace{} = trace} <- Traces.create_trace(conn.assigns.current_user, trace_params) do
      conn
      |> put_status(:created)
      |> render("show.json", event: event)
    end
  end

  def create(conn, %{"trace_id" => trace_id, "event" => event_params}) do
    # ⚠️ 🔒 this is bad. Should rely on the connection or token for authentication
    with {:ok, %Event{} = event} <- Traces.create_event(trace_id, event_params) do
      # with {:ok, %Trace{} = trace} <- Traces.create_trace(conn.assigns.current_user, trace_params) do
      conn
      |> put_status(:created)
      |> render("show.json", event: event)
    end
  end

  def update(conn, %{"id" => id, "event" => event_params}) do
    event = Traces.get_event!(id)

    with {:ok, %Event{} = event} <- Traces.update_event(event, event_params) do
      render(conn, "show.json", event: event)
    end
  end
end
