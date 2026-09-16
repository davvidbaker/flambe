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

  def update(conn, %{"id" => id, "user" => attrs}) do
    user = Accounts.get_current_user!(conn.assigns.current_user, id)

    case Accounts.update_user_settings(user, attrs) do
      {:ok, user} ->
        json(conn, %{data: %{settings: user.settings}})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: errors(changeset)})
    end
  end

  defp errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, _options} -> message end)
  end
end
