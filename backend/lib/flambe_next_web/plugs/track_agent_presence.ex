defmodule FlambeNextWeb.Plugs.TrackAgentPresence do
  import Plug.Conn

  alias FlambeNext.AgentPresence

  def init(options), do: options

  def call(%{request_path: request_path} = conn, _options)
      when request_path in ["/api/agent-status", "/api/agent-status/stream"],
      do: conn

  def call(conn, _options) do
    case Map.get(conn.assigns, :api_token) do
      nil ->
        conn

      api_token ->
        register_before_send(conn, fn conn ->
          if conn.status in 200..299 do
            AgentPresence.record(conn.assigns.current_user.id, api_token.id)
          end

          conn
        end)
    end
  end
end
