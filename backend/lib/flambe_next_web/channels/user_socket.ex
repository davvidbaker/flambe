defmodule FlambeNextWeb.UserSocket do
  use Phoenix.Socket

  alias FlambeNext.Accounts

  channel "events:*", FlambeNextWeb.EventsChannel

  def connect(_params, socket, %{session: session}) when is_map(session) do
    case Map.get(session, "user_id") || Map.get(session, :user_id) do
      nil -> :error
      user_id -> connect_user(socket, user_id)
    end
  end

  def connect(_params, _socket, _connect_info), do: :error

  def id(socket), do: "user_socket:#{socket.assigns.current_user.id}"

  defp connect_user(socket, user_id) do
    case Accounts.get_user(user_id) do
      nil -> :error
      user -> {:ok, assign(socket, :current_user, user)}
    end
  end
end
