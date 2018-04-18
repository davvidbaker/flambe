defmodule StitchWeb.MantraController do
  use StitchWeb, :controller

  alias Stitch.Accounts
  alias Stitch.Accounts.Mantra

  action_fallback(StitchWeb.FallbackController)

  def index(conn, _params) do
    mantras = Accounts.list_mantras()
    render(conn, "index.json", mantras: mantras)
  end

  def create(conn, %{"user_id" => user_id, "mantra" => mantra_params}) do
    with {:ok, %Mantra{} = mantra} <- Accounts.create_mantra(user_id, mantra_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", mantra_path(conn, :show, mantra))
      |> render("show.json", mantra: mantra)
    end
  end

  def show(conn, %{"id" => id}) do
    mantra = Accounts.get_mantra!(id)
    render(conn, "show.json", mantra: mantra)
  end

  def update(conn, %{"id" => id, "mantra" => mantra_params}) do
    mantra = Accounts.get_mantra!(id)

    with {:ok, %Mantra{} = mantra} <- Accounts.update_mantra(mantra, mantra_params) do
      render(conn, "show.json", mantra: mantra)
    end
  end

  def delete(conn, %{"id" => id}) do
    mantra = Accounts.get_mantra!(id)

    with {:ok, %Mantra{}} <- Accounts.delete_mantra(mantra) do
      send_resp(conn, :no_content, "")
    end
  end
end
