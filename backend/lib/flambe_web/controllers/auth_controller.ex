defmodule FlambeWeb.AuthController do
  use FlambeWeb, :controller
  plug(Ueberauth)

  alias Ueberauth.Strategy.Helpers
  alias Flambe.Accounts

  def request(conn, _params) do
    IO.puts("\n🐵conn")
    IO.inspect(conn)
    render(conn, "request.html", callback_url: Helpers.callback_url(conn))
  end

  def callback(%{assigns: %{ueberauth_auth: auth}} = conn, _params) do
    case Accounts.UserFromAuth.find_or_create(auth) do
      {:ok, user} ->
        IO.puts("\n🔥user.username")
        IO.inspect(user.username)
        jwt = Accounts.create_user_access_token(user)

        conn
        # |> put_resp_cookie("refresh", jwt)
        |> Flambe.Guardian.Plug.remember_me(user)
        |> IO.inspect()
        |> redirect_to_frontend_path(user.username)

      {:error, reason} ->
        conn
        |> put_flash(:error, reason)
        |> redirect_to_frontend_path
    end
  end

  def callback(%{assigns: %{ueberauth_failure: _fails}} = conn, _params) do
    IO.puts("\n😃conn.assigns")
    IO.inspect(conn.assigns)

    conn
    |> put_flash(:error, "Failed to authenticate.")
    |> redirect_to_frontend_path
  end

  def identity_callback(%{assigns: %{ueberauth_auth: auth}} = conn, _params) do
    case Accounts.authenticate_by_email_password(auth.uid, auth.credentials.other.password) do
      {:ok, user} ->
        trace = user |> Flambe.Traces.list_user_traces() |> List.first()

        conn
        # VerifyCookie exchanges the long-lived cookie for an access token on
        # each API request, so this must remain Guardian's default refresh type.
        |> Flambe.Guardian.Plug.remember_me(user)
        |> json(%{data: %{id: user.id, username: user.username, trace_id: trace && trace.id}})

      {:error, _reason} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "INVALID_CREDENTIALS"})
    end
  end

  def identity_callback(%{assigns: %{ueberauth_failure: _fails}} = conn, _params) do
    IO.puts("\n😃conn.assigns")
    IO.inspect(conn.assigns)

    conn
    |> put_flash(:error, "Failed to authenticate.")
    |> redirect_to_frontend_path
  end

  def redirect_to_frontend_path(conn, path \\ '') do
    conn
    |> redirect(external: "#{Application.get_env(:flambe, :frontend_url)}/#{path}")
  end

  def get_csrf(conn, _params) do
    conn
    |> send_resp(:ok, Plug.CSRFProtection.get_csrf_token)
    # |> send_resp(:ok, Plug.CSRFProtection.get_csrf_token_for("http://localhost:8081"))
  end

  # redirect(conn, external: "http://localhost:8081")
  # text conn, "redirect!"
end
