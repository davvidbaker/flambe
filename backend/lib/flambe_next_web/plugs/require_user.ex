defmodule FlambeNextWeb.Plugs.RequireUser do
  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  alias FlambeNext.Accounts
  alias FlambeNext.Accounts.ApiTokens

  def init(options), do: options

  def call(conn, _options) do
    case session_user(conn) || bearer_user(conn) do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "UNAUTHENTICATED"})
        |> halt()

      user ->
        assign(conn, :current_user, user)
    end
  end

  defp session_user(conn) do
    case get_session(conn, :user_id) do
      nil -> nil
      user_id -> Accounts.get_user(user_id)
    end
  end

  defp bearer_user(conn) do
    case get_req_header(conn, "authorization") do
      ["Bearer " <> raw_token] ->
        case ApiTokens.authenticate(raw_token) do
          {:ok, user} -> user
          {:error, :invalid_token} -> nil
        end

      _ ->
        nil
    end
  end
end
