defmodule FlambeNextWeb.Plugs.RequireUser do
  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  alias FlambeNext.Accounts
  alias FlambeNext.Accounts.ApiTokens

  def init(options), do: options

  def call(conn, _options) do
    case session_user(conn) || bearer_authentication(conn) do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "UNAUTHENTICATED"})
        |> halt()

      %{} = user ->
        assign(conn, :current_user, user)

      {user, api_token} ->
        ApiTokens.touch_last_used(api_token)

        conn
        |> assign(:current_user, user)
        |> assign(:api_token, api_token)
    end
  end

  defp session_user(conn) do
    case get_session(conn, :user_id) do
      nil -> nil
      user_id -> Accounts.get_user(user_id)
    end
  end

  defp bearer_authentication(conn) do
    case get_req_header(conn, "authorization") do
      ["Bearer " <> raw_token] ->
        case ApiTokens.authenticate_with_token(raw_token) do
          {:ok, user, api_token} -> {user, api_token}
          {:error, :invalid_token} -> nil
        end

      _ ->
        nil
    end
  end
end
