defmodule FlambeNextWeb.Plugs.RequireBrowserUser do
  @moduledoc false

  import Plug.Conn
  import Phoenix.Controller, only: [redirect: 2]

  alias FlambeNext.Accounts

  def init(options), do: options

  def call(conn, _options) do
    case session_user(conn) do
      nil ->
        conn
        |> redirect(to: "/")
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
end
