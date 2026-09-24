defmodule FlambeNextWeb.TraceController do
  use FlambeNextWeb, :controller

  alias FlambeNext.{Accounts, Traces}

  def index(conn, _params) do
    render(conn, :index, traces: Traces.list_user_traces(conn.assigns.current_user))
  end

  def create(conn, %{"trace" => attrs}) do
    user = conn.assigns.current_user

    case Traces.create_trace(user, attrs) do
      {:ok, trace} ->
        Accounts.ensure_default_categories(user)
        trace = Traces.get_user_trace!(user, trace.id)

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

    render(conn, :show,
      trace: trace,
      events: events,
      unstarted: Traces.list_unstarted_activities(trace)
    )
  end

  def update(conn, %{"id" => id, "trace" => attrs}) do
    trace = Traces.get_user_trace!(conn.assigns.current_user, id)

    case Traces.update_trace(trace, attrs) do
      {:ok, trace} ->
        {trace, events} = Traces.get_user_trace_with_events!(conn.assigns.current_user, trace.id)

        render(conn, :show,
          trace: trace,
          events: events,
          unstarted: Traces.list_unstarted_activities(trace)
        )

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

  def reorder_threads(conn, %{"id" => id, "thread_ids" => thread_ids}) do
    trace = Traces.get_user_trace!(conn.assigns.current_user, id)

    case Traces.reorder_threads(trace, thread_ids) do
      {:ok, trace} ->
        json(conn, %{
          data: %{
            threads: Enum.map(trace.threads, &%{id: &1.id, name: &1.name, rank: &1.rank})
          }
        })

      {:error, :invalid_thread_ids} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: %{thread_ids: ["must include each thread in this trace exactly once"]}})
    end
  end

  def reorder_threads(conn, %{"id" => id}) do
    reorder_threads(conn, %{"id" => id, "thread_ids" => []})
  end

  defp errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, _options} -> message end)
  end
end
