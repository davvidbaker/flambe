defmodule FlambeNextWeb.TodoController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Accounts

  def index(conn, _params) do
    render(conn, :index, todos: Accounts.list_user_todos(conn.assigns.current_user))
  end

  def create(conn, %{"todo" => attrs}) do
    case Accounts.create_todo(conn.assigns.current_user, attrs) do
      {:ok, todo} ->
        conn
        |> put_status(:created)
        |> render(:show, todo: todo)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: errors(changeset)})
    end
  end

  def show(conn, %{"id" => id}) do
    render(conn, :show, todo: Accounts.get_user_todo!(conn.assigns.current_user, id))
  end

  def update(conn, %{"id" => id, "todo" => attrs}) do
    todo = Accounts.get_user_todo!(conn.assigns.current_user, id)

    case Accounts.update_todo(todo, attrs) do
      {:ok, todo} ->
        render(conn, :show, todo: todo)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: errors(changeset)})
    end
  end

  def delete(conn, %{"id" => id}) do
    todo = Accounts.get_user_todo!(conn.assigns.current_user, id)
    {:ok, _todo} = Accounts.delete_todo(todo)
    send_resp(conn, :no_content, "")
  end

  defp errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, _options} -> message end)
  end
end
