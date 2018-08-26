defmodule SteadyWeb.SessionController do
  use SteadyWeb, :controller

  alias Flambe.Accounts

  # 👇 this is what the create function looked like when we were returning html.
  # def create(conn, %{"user" => %{"email" => email, "password" => password}}) do
  #   case Accounts.authenticate_by_email_password(email, password) do
  #     {:ok, user} ->
  #       conn
  #       |> put_flash(:info, "Welcome back!")
  #       |> put_session(:user_id, user.id)
  #       |> configure_session(renew: true)
  #       |> redirect(to: "/")
  #     {:error, :unauthorized} ->
  #       conn
  #       |> put_flash(:error, "Bad email/password combo")
  #       |> redirect(to: session_path(conn, :new))
  #     end
  # end

  def create(conn, %{"user" => %{"email" => email, "password" => password}}) do
    case Accounts.authenticate_by_email_password(email, password) do
      {:ok, user} ->
        conn
        |> assign(:current_user, user)
        |> put_session(:user_id, user.id)
        |> configure_session(renew: true)
        |> put_status(200)
        |> Phoenix.Controller.json(%{message: "logged in"})
        |> halt()

      {:error, :unauthorized} ->
        conn
        |> put_status(403)
        |> Phoenix.Controller.json(%{error: "ACCOUNT_NOT_FOUND"})
        |> halt()

        # |> redirect(to: session_path(conn, :new))
    end
  end

  def delete(conn, _) do
    conn
    |> configure_session(drop: true)
    |> redirect(to: "/")
  end
end
