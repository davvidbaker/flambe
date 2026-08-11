defmodule FlambeNextWeb.TraceController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Traces

  def show(conn, %{"id" => id}) do
    {trace, events} = Traces.get_user_trace_with_events!(conn.assigns.current_user, id)
    render(conn, :show, trace: trace, events: events)
  end
end
