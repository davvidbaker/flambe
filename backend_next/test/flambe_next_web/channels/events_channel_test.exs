defmodule FlambeNextWeb.EventsChannelTest do
  use FlambeNextWeb.ChannelCase, async: true

  alias FlambeNext.Accounts
  alias FlambeNextWeb.UserSocket

  test "only joins the signed-in user's event topic" do
    {:ok, user} = Accounts.create_user(%{name: "Channel User", username: "channel-user"})

    socket = socket(UserSocket, "user_socket", %{current_user: user})

    assert {:ok, _, _socket} = subscribe_and_join(socket, "events:#{user.id}")
    assert {:error, %{reason: "unauthorized"}} = subscribe_and_join(socket, "events:999")
  end

  test "connect reads the authenticated user from the signed session" do
    {:ok, user} = Accounts.create_user(%{name: "Socket User", username: "socket-user"})

    assert {:ok, socket} =
             UserSocket.connect(%{}, socket(UserSocket, "socket", %{}), %{
               session: %{"user_id" => user.id}
             })

    assert socket.assigns.current_user.id == user.id

    assert {:ok, _socket} =
             UserSocket.connect(%{}, socket(UserSocket, "socket", %{}), %{
               session: %{user_id: user.id}
             })

    assert :error = UserSocket.connect(%{}, socket(UserSocket, "socket", %{}), %{session: %{}})

    assert :error = UserSocket.connect(%{}, socket(UserSocket, "socket", %{}), %{session: nil})
  end
end
