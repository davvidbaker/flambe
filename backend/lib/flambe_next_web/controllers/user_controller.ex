defmodule FlambeNextWeb.UserController do
  use FlambeNextWeb, :controller

  alias FlambeNext.{Accounts, Traces}

  def show(conn, %{"id" => id}) do
    user = Accounts.get_current_user!(conn.assigns.current_user, id)

    render(conn, :show,
      user: user,
      traces: Traces.list_user_traces(user),
      categories: Accounts.ensure_default_categories(user),
      todos: Accounts.list_user_todos(user),
      mantras: Accounts.list_user_mantras(user),
      attentions: Accounts.list_user_attentions(user),
      tabs: Accounts.list_user_tabs(user),
      search_terms: Accounts.list_user_search_terms(user),
      observations: Accounts.list_user_observations(user)
    )
  end
end
