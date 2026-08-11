defmodule FlambeNextWeb.UserController do
  use FlambeNextWeb, :controller

  alias FlambeNext.{Accounts, Traces}

  def show(conn, %{"id" => id}) do
    user = Accounts.get_current_user!(conn.assigns.current_user, id)

    render(conn, :show,
      user: user,
      traces: Traces.list_user_traces(user),
      categories: Accounts.list_user_categories(user),
      todos: Accounts.list_user_todos(user)
    )
  end
end
