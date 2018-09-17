defmodule SteadyWeb.ThreadController do
  use SteadyWeb, :controller

  alias Flambe.Traces
  alias Flambe.Traces.Thread

  action_fallback(SteadyWeb.FallbackController)

  def index(conn, _params) do
    threads = Traces.list_threads()
    render(conn, "index.json", threads: threads)
  end

  def create(conn, %{"trace_id" => trace_id, "thread" => thread_params}) do
    with trace <- Traces.get_trace!(trace_id),
         {:ok, %Thread{} = thread} <- Traces.create_thread(trace, thread_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", thread_path(conn, :show, thread))
      |> render("show.json", thread: thread)
    end
  end

  def show(conn, %{"id" => id}) do
    thread = Traces.get_thread!(id)
    render(conn, "show.json", thread: thread)
  end

  def update(conn, %{"id" => id, "thread" => thread_params}) do
    thread = Traces.get_thread!(id)

    with {:ok, %Thread{} = thread} <- Traces.update_thread(thread, thread_params) do
      render(conn, "show.json", thread: thread)
    end
  end

  def delete(conn, %{"id" => id}) do
    thread = Traces.get_thread!(id)

    with {:ok, %Thread{}} <- Traces.delete_thread(thread) do
      send_resp(conn, :no_content, "")
    end
  end
end
