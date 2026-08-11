defmodule FlambeNextWeb.TraceController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Traces

  def index(conn, _params) do
    render(conn, :index, traces: Traces.list_user_traces(conn.assigns.current_user))
  end

  def create(conn, %{"trace" => attrs}) do
    case Traces.create_trace(conn.assigns.current_user, attrs) do
      {:ok, trace} ->
        trace = Traces.get_user_trace!(conn.assigns.current_user, trace.id)

        conn
        |> put_status(:created)
        |> render(:show, trace: trace)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: errors(changeset)})
    end
  end

  def show(conn, %{"id" => id}) do
    {trace, events} = Traces.get_user_trace_with_events!(conn.assigns.current_user, id)
    render(conn, :show, trace: trace, events: events)
  end

  def update(conn, %{"id" => id, "trace" => attrs}) do
    trace = Traces.get_user_trace!(conn.assigns.current_user, id)

    case Traces.update_trace(trace, attrs) do
      {:ok, trace} ->
        {trace, events} = Traces.get_user_trace_with_events!(conn.assigns.current_user, trace.id)
        render(conn, :show, trace: trace, events: events)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: errors(changeset)})
    end
  end

  def delete(conn, %{"id" => id}) do
    trace = Traces.get_user_trace!(conn.assigns.current_user, id)
    {:ok, _trace} = Traces.delete_trace(trace)
    send_resp(conn, :no_content, "")
  end

  defp errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, _options} -> message end)
  end
end
