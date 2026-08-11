defmodule FlambeNextWeb.EventsChannel do
  use Phoenix.Channel

  def join("events:" <> user_id, _params, socket) do
    if user_id == Integer.to_string(socket.assigns.current_user.id) do
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end
end
