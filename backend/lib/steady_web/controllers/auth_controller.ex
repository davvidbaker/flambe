defmodule SteadyWeb.AuthController do
  use SteadyWeb, :controller
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
    case Steady.Accounts.UserFromAuth.find_or_create(auth) do
      {:ok, user} ->
        conn
        |> put_flash(:info, "Successfully authenticated.")
        |> Steady.Guardian.Plug.sign_in(user)
        # Do I need this? 🤔
        |> put_session(:current_user, user)
        # |> redirect(external: "http://localhost:8081")
        #
        |> redirect(to: "/")

      # ⚠️ fix this and here is where I left off. How do I ASDF
      # HOW DO I now send this token to 8081? Maybe something something sockets

      {:error, reason} ->
        conn
        |> put_flash(:error, reason)
        |> redirect(to: "/")
    end

    redirect(conn, external: "http://localhost:8081")
    # text conn, "redirect!"
  end
end
