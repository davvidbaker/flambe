defmodule FlambeNextWeb.McpPlug do
  @moduledoc false

  @behaviour Plug

  alias FlambeNextWeb.MCPHandler

  @impl Plug
  def init(_opts) do
    ExMCP.HttpPlug.init(
      handler: MCPHandler,
      handler_opts: {__MODULE__, :handler_opts, []},
      server_info: %{name: "flambe", version: "0.1.0"},
      server_capabilities: %{tools: %{listChanged: false}},
      protocol_mode: :prefer_modern,
      legacy_http_sse: false,
      allowed_origins: [],
      allowed_hosts: :any
    )
  end

  @impl Plug
  def call(conn, opts) do
    allowed_hosts = Application.fetch_env!(:flambe_next, :mcp_allowed_hosts)
    ExMCP.HttpPlug.call(conn, Map.put(opts, :allowed_hosts, allowed_hosts))
  end

  def handler_opts(conn, _request) do
    %{
      user: conn.assigns.current_user,
      agent: Map.get(conn.assigns, :agent),
      platform?: Plug.Conn.get_req_header(conn, "x-flambe-agent-platform") != []
    }
  end
end
