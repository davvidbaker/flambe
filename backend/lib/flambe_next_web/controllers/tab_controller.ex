defmodule FlambeNextWeb.TabController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Accounts
  alias FlambeNextWeb.Endpoint

  def index(conn, _params),
    do: render(conn, :index, tabs: Accounts.list_user_tabs(conn.assigns.current_user))

  def create(conn, %{"tabs" => attrs}) do
    user = conn.assigns.current_user

    case Accounts.create_tab(user, attrs) do
      {:ok, tab} ->
        Endpoint.broadcast("events:#{user.id}", "tabs", %{
          tabs_count: tab.count,
          window_count: tab.window_count,
          timestamp: DateTime.to_unix(tab.timestamp, :millisecond)
        })

        conn |> put_status(:created) |> render(:show, tab: tab)

      {:error, changeset} ->
        invalid(conn, changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    render(conn, :show, tab: Accounts.get_user_tab!(conn.assigns.current_user, id))
  end

  def update(conn, %{"id" => id, "tabs" => attrs}) do
    tab = Accounts.get_user_tab!(conn.assigns.current_user, id)

    case Accounts.update_tab(tab, attrs) do
      {:ok, tab} -> render(conn, :show, tab: tab)
      {:error, changeset} -> invalid(conn, changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    tab = Accounts.get_user_tab!(conn.assigns.current_user, id)
    {:ok, _tab} = Accounts.delete_tab(tab)
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
