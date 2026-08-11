defmodule FlambeNextWeb.Plugs.RequireUser do
  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  alias FlambeNext.Accounts

  def init(options), do: options

  def call(conn, _options) do
    user =
      case get_session(conn, :user_id) do
        nil -> nil
        user_id -> Accounts.get_user(user_id)
      end

    case user do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "UNAUTHENTICATED"})
        |> halt()

      user ->
        assign(conn, :current_user, user)
    end
  end
end
