defmodule FlambeWeb.AuthController do
  use FlambeWeb, :controller
  # plug Ueberauth

  # alias Ueberauth.Strategy.Helpers

  def request(conn, _params) do
    IO.inspect(conn)
  end

  def callback(%{assigns: %{ueberauth_failure: _fails}} = conn, _params) do
    conn
    |> put_flash(:error, "Failed to authenticate.")
    |> redirect(to: "/")
  end

  def callback(%{assigns: %{ueberauth_auth: auth}} = conn, _params) do
    case Flambe.Accounts.UserFromAuth.find_or_create(auth) do
      {:ok, user} ->
        conn
        |> put_flash(:info, "Successfully authenticated.")
        |> put_session(:current_user, user)
        |> redirect(to: "/")

      {:error, reason} ->
        conn
        |> put_flash(:error, reason)
        |> redirect(to: "/")
    end

    redirect(conn, external: "http://localhost:8081")
    # text conn, "redirect!"    
  end
end
