defmodule FlambeNextWeb.SearchTermController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Accounts
  alias FlambeNextWeb.Endpoint

  def index(conn, _params),
    do:
      render(conn, :index,
        search_terms: Accounts.list_user_search_terms(conn.assigns.current_user)
      )

  def create(conn, %{"search_term" => attrs}) do
    user = conn.assigns.current_user

    case Accounts.create_search_term(user, attrs) do
      {:ok, search_term} ->
        Endpoint.broadcast("events:#{user.id}", "search_terms", %{
          term: search_term.term,
          timestamp: DateTime.to_unix(search_term.timestamp, :millisecond)
        })

        conn |> put_status(:created) |> render(:show, search_term: search_term)

      {:error, changeset} ->
        invalid(conn, changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    render(conn, :show,
      search_term: Accounts.get_user_search_term!(conn.assigns.current_user, id)
    )
  end

  def update(conn, %{"id" => id, "search_term" => attrs}) do
    search_term = Accounts.get_user_search_term!(conn.assigns.current_user, id)

    case Accounts.update_search_term(search_term, attrs) do
      {:ok, search_term} -> render(conn, :show, search_term: search_term)
      {:error, changeset} -> invalid(conn, changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    search_term = Accounts.get_user_search_term!(conn.assigns.current_user, id)
    {:ok, _search_term} = Accounts.delete_search_term(search_term)
    send_resp(conn, :no_content, "")
  end

  defp invalid(conn, changeset) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{
      errors: Ecto.Changeset.traverse_errors(changeset, fn {message, _options} -> message end)
    })
  end
end
