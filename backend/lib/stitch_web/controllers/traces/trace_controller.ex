defmodule StitchWeb.TraceController do
  use StitchWeb, :controller

  alias Stitch.Traces
  alias Stitch.Traces.{Trace, Thread}

  action_fallback StitchWeb.FallbackController

  def index(conn, _params) do
    traces = Traces.list_traces()
    render(conn, "index.json", traces: traces)
  end

  # 💁 A trace automatically comes with a main thread.
  def create(conn, %{"user_id" => user_id, "trace" => trace_params}) do
    # ⚠️ this is bad. Should rely on the connection or token, not explicitly using id: 6 🤦‍
    with {:ok, %Trace{} = trace} <- Traces.create_trace(Stitch.Accounts.get_user!(user_id), trace_params), 
    {:ok, %Thread{} = thread} <- Traces.create_thread(trace.id, %{name: "Main"}) do
      # with {:ok, %Trace{} = trace} <- Traces.create_trace(conn.assigns.current_user, trace_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", trace_path(conn, :show, trace))
      |> render("show.json", trace: trace)
    end
  end

  def show(conn, %{"id" => id}) do
    {events, trace} = Traces.get_trace_with_events(id)
    IO.puts "\nevents"
    IO.inspect events
    render(conn, "show.json", %{trace: trace, events: events})
  end

  def update(conn, %{"id" => id, "trace" => trace_params}) do
    trace = Traces.get_trace!(id)

    with {:ok, %Trace{} = trace} <- Traces.update_trace(trace, trace_params) do
      render(conn, "show.json", trace: trace)
    end
  end

  def delete(conn, %{"id" => id}) do
    trace = Traces.get_trace!(id)
    with {:ok, %Trace{}} <- Traces.delete_trace(trace) do
      send_resp(conn, :no_content, "")
    end
  end
end
