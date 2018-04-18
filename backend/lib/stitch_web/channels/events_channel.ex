defmodule StitchWeb.EventChannel do
  use Phoenix.Channel

  # ⚠️ this is probably not secure
"""
def join("users:" <> user_id, _params, socket) do
{user_id, _} = Integer.parse(user_id)

%{id: id} = socket.assigns[:user]

#prevent connection to solo channel of other users, but allow in development
case id == user_id || Mix.env == :dev do
true ->
{:ok, socket}
false ->
{:error, "This is not your solo channel!"}
end
end
"""
  def join("events:" <> user_id, _message, socket) do
    {:ok, socket}
  end
  # def join("room:" <> _private_room_id, _params, _socket) do
  #   {:error, %{reason: "unauthorized"}}
  # end
 end
