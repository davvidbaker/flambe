defmodule FlambeNextWeb.TraceController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Traces

  def show(conn, %{"id" => id}) do
    trace = Traces.get_user_trace!(conn.assigns.current_user, id)
    render(conn, :show, trace: trace)
  end
end
