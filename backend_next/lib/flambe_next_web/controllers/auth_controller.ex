defmodule FlambeNextWeb.AuthController do
  use FlambeNextWeb, :controller

  alias FlambeNext.{Accounts, Traces}

  def identity_callback(conn, %{"email" => email, "password" => password}) do
    case Accounts.authenticate_by_email_password(email, password) do
      {:ok, user} ->
        trace_id = user |> Traces.list_user_traces() |> List.first() |> then(&(&1 && &1.id))

        conn
        |> configure_session(renew: true)
        |> put_session(:user_id, user.id)
        |> json(%{data: %{id: user.id, username: user.username, trace_id: trace_id}})

      {:error, :invalid_credentials} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "INVALID_CREDENTIALS"})
    end
  end

  def identity_callback(conn, _params) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: "INVALID_CREDENTIALS"})
  end

  def logout(conn, _params) do
    conn
    |> configure_session(drop: true)
    |> send_resp(:no_content, "")
  end
end
