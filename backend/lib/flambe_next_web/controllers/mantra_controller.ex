defmodule FlambeNextWeb.MantraController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Accounts

  def index(conn, _params),
    do: render(conn, :index, mantras: Accounts.list_user_mantras(conn.assigns.current_user))

  def create(conn, %{"mantra" => attrs}) do
    case Accounts.create_mantra(conn.assigns.current_user, attrs) do
      {:ok, mantra} -> conn |> put_status(:created) |> render(:show, mantra: mantra)
      {:error, changeset} -> invalid(conn, changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    render(conn, :show, mantra: Accounts.get_user_mantra!(conn.assigns.current_user, id))
  end

  def update(conn, %{"id" => id, "mantra" => attrs}) do
    mantra = Accounts.get_user_mantra!(conn.assigns.current_user, id)

    case Accounts.update_mantra(mantra, attrs) do
      {:ok, mantra} -> render(conn, :show, mantra: mantra)
      {:error, changeset} -> invalid(conn, changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    mantra = Accounts.get_user_mantra!(conn.assigns.current_user, id)
    {:ok, _mantra} = Accounts.delete_mantra(mantra)
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
