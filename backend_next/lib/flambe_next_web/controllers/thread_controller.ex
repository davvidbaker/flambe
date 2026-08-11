defmodule FlambeNextWeb.ThreadController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Traces

  def create(conn, %{"trace_id" => trace_id, "thread" => attrs}) do
    trace = Traces.get_user_trace!(conn.assigns.current_user, trace_id)

    case Traces.create_thread(trace, attrs) do
      {:ok, thread} ->
        conn
        |> put_status(:created)
        |> render(:show, thread: thread)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: errors(changeset)})
    end
  end

  def show(conn, %{"id" => id}) do
    render(conn, :show, thread: Traces.get_user_thread!(conn.assigns.current_user, id))
  end

  def update(conn, %{"id" => id, "thread" => attrs}) do
    thread = Traces.get_user_thread!(conn.assigns.current_user, id)

    case Traces.update_thread(thread, attrs) do
      {:ok, thread} ->
        render(conn, :show, thread: thread)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: errors(changeset)})
    end
  end

  def delete(conn, %{"id" => id}) do
    thread = Traces.get_user_thread!(conn.assigns.current_user, id)
    {:ok, _thread} = Traces.delete_thread(thread)
    send_resp(conn, :no_content, "")
  end

  defp errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, _options} -> message end)
  end
end
