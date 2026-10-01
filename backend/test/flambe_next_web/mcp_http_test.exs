defmodule FlambeNextWeb.McpHttpTest do
  use FlambeNext.DataCase, async: false

  alias FlambeNext.{Accounts, Traces}
  alias FlambeNext.Accounts.ApiTokens

  setup do
    previous_hosts = Application.fetch_env!(:flambe_next, :mcp_allowed_hosts)
    Application.put_env(:flambe_next, :mcp_allowed_hosts, ["127.0.0.1"])
    on_exit(fn -> Application.put_env(:flambe_next, :mcp_allowed_hosts, previous_hosts) end)

    server =
      start_supervised!({Bandit, plug: FlambeNextWeb.Endpoint, ip: {127, 0, 0, 1}, port: 0})

    {:ok, {_, port}} = ThousandIsland.listener_info(server)
    suffix = System.unique_integer([:positive])
    {:ok, user} = Accounts.create_user(%{name: "HTTP MCP", username: "http-mcp-#{suffix}"})
    {:ok, trace} = Traces.create_trace(user, %{name: "HTTP MCP test"})
    {:ok, _, token} = ApiTokens.create(user, "HTTP test")

    %{url: "http://127.0.0.1:#{port}", token: token, user: user, trace: trace}
  end

  for mode <- [:modern_only, :legacy_only] do
    @mode mode
    test "#{mode} client discovers tools and shares an activity lifecycle with REST", context do
      client =
        start_supervised!({
          ExMCP.Client,
          # This external-agent endpoint rejects browser Origins. ExMCP otherwise
          # synthesizes an Origin even for its non-browser HTTP client.
          transport: :http,
          url: context.url <> "/mcp",
          protocol_mode: @mode,
          security: %{origin: nil},
          headers: [{"authorization", "Bearer #{context.token}"}],
          reconnect: false,
          health_check_interval: 0
        })

      assert {:ok, %{"tools" => tools}} = ExMCP.Client.list_tools(client, format: :map)
      assert Enum.any?(tools, &(&1["name"] == "flambe_start"))

      assert {:ok, %{"isError" => false, "structuredContent" => %{"activity_id" => id}}} =
               ExMCP.Client.call_tool(
                 client,
                 "flambe_start",
                 %{
                   "trace_id" => context.trace.id,
                   "name" => "Started by HTTP client",
                   "thread_id" => hd(Repo.preload(context.trace, :threads).threads).id,
                   "agent_id" => "http-client"
                 },
                 format: :map
               )

      assert Traces.get_user_activity!(context.user, id).agent_id == "http-client"

      response =
        Req.post!(context.url <> "/api/agent-commands",
          headers: [{"authorization", "Bearer #{context.token}"}],
          json: %{command: "end", arguments: %{trace_id: context.trace.id, activity_id: id}}
        )

      assert response.status == 200
      assert response.body["data"]["activity_id"] == id

      assert {:ok, %{"structuredContent" => %{"state" => %{"activities" => activities}}}} =
               ExMCP.Client.call_tool(client, "flambe_status", %{"trace_id" => context.trace.id},
                 format: :map
               )

      assert Enum.any?(activities, &(&1["id"] == id and &1["latestEvent"]["phase"] == "E"))
    end
  end

  test "HTTP endpoint rejects an invalid bearer token", %{url: url} do
    response =
      Req.post!(url <> "/mcp",
        headers: [{"authorization", "Bearer invalid-token"}],
        json: %{jsonrpc: "2.0", id: 1, method: "tools/list"}
      )

    assert response.status == 401
    assert response.body == %{"error" => "UNAUTHENTICATED"}
  end
end
