defmodule FlambeNextWeb.McpControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, Agents, Traces}
  alias FlambeNextWeb.Endpoint

  setup %{conn: conn} do
    suffix = System.unique_integer([:positive])
    {:ok, user} = Accounts.create_user(%{name: "MCP User", username: "mcp-user-#{suffix}"})
    {:ok, trace} = Traces.create_trace(user, %{name: "MCP trace"})

    %{conn: authenticated_as(conn, user), trace: trace, user: user}
  end

  test "supports legacy initialization and initialized notifications", %{conn: conn} do
    initialized =
      post(conn, ~p"/mcp", %{
        "jsonrpc" => "2.0",
        "id" => 1,
        "method" => "initialize",
        "params" => %{
          "protocolVersion" => "2025-11-25",
          "capabilities" => %{},
          "clientInfo" => %{"name" => "test", "version" => "1"}
        }
      })

    assert %{
             "jsonrpc" => "2.0",
             "id" => 1,
             "result" => %{
               "protocolVersion" => "2025-11-25",
               "capabilities" => %{"tools" => %{"listChanged" => false}}
             }
           } = json_response(initialized, 200)

    notification =
      initialized
      |> recycle()
      |> post(~p"/mcp", %{"jsonrpc" => "2.0", "method" => "notifications/initialized"})

    assert response(notification, 202) == ""
  end

  test "discovers the stateless protocol and all agent tools", %{conn: conn} do
    discovered =
      conn
      |> modern_headers("server/discover")
      |> post(~p"/mcp", %{"jsonrpc" => "2.0", "id" => "discover", "method" => "server/discover"})

    assert %{
             "result" => %{
               "protocolVersion" => "2026-07-28",
               "capabilities" => %{"tools" => %{}}
             }
           } = json_response(discovered, 200)

    listed =
      discovered
      |> recycle()
      |> modern_headers("tools/list")
      |> post(~p"/mcp", %{"jsonrpc" => "2.0", "id" => 2, "method" => "tools/list"})

    %{"result" => %{"tools" => tools, "ttlMs" => 300_000, "cacheScope" => "private"}} =
      json_response(listed, 200)

    assert Enum.map(tools, & &1["name"]) == [
             "flambe_start",
             "flambe_end",
             "flambe_suspend",
             "flambe_resume",
             "flambe_status",
             "flambe_message"
           ]

    assert get_in(Enum.find(tools, &(&1["name"] == "flambe_start")), ["inputSchema", "required"]) ==
             ["trace_id", "name"]

    status = Enum.find(tools, &(&1["name"] == "flambe_status"))
    assert get_in(status, ["inputSchema", "properties", "thread_id", "type"]) == "integer"
  end

  test "executes tools with structured results and header identity", %{
    conn: conn,
    trace: trace,
    user: user
  } do
    :ok = Endpoint.subscribe("events:#{trace.user_id}")

    conn =
      conn
      |> put_req_header("x-flambe-agent-id", "mcp-header-agent")
      |> put_req_header("x-flambe-agent-name", "MCP Header Agent")
      |> modern_headers("tools/call", "flambe_start")
      |> post(~p"/mcp", %{
        "jsonrpc" => "2.0",
        "id" => 3,
        "method" => "tools/call",
        "params" => %{
          "name" => "flambe_start",
          "arguments" => %{
            "trace_id" => trace.id,
            "name" => "Called over MCP",
            "agent_id" => "body-agent"
          }
        }
      })

    assert %{
             "result" => %{
               "isError" => false,
               "content" => [%{"type" => "text", "text" => text}],
               "structuredContent" => %{
                 "activity_id" => activity_id,
                 "state" => %{"activities" => activities}
               }
             }
           } = json_response(conn, 200)

    assert is_binary(text)

    assert Enum.any?(activities, fn activity ->
             activity["id"] == activity_id and activity["agentId"] == "mcp-header-agent"
           end)

    assert_receive %Phoenix.Socket.Broadcast{
      event: "timeline_event",
      payload: %{trace_id: trace_id, event: %{activity: %{id: ^activity_id}}}
    }

    assert trace_id == trace.id

    status =
      conn
      |> recycle()
      |> authenticated_as(user)
      |> post(~p"/api/agent-commands", %{
        "command" => "status",
        "arguments" => %{"trace_id" => trace.id}
      })

    structured_state = get_in(json_response(conn, 200), ["result", "structuredContent", "state"])
    assert %{"data" => %{"state" => ^structured_state}} = json_response(status, 200)

    ended =
      status
      |> recycle()
      |> authenticated_as(user)
      |> post(~p"/api/agent-commands", %{
        "command" => "end",
        "arguments" => %{"trace_id" => trace.id, "activity_id" => activity_id}
      })

    assert %{
             "data" => %{
               "activity_id" => ^activity_id,
               "event_id" => end_event_id,
               "state" => %{"activities" => ended_activities}
             }
           } = json_response(ended, 200)

    assert is_integer(end_event_id)

    assert Enum.any?(
             ended_activities,
             &(&1["id"] == activity_id and get_in(&1, ["latestEvent", "phase"]) == "E")
           )
  end

  test "returns command failures as tool errors and protocol failures as JSON-RPC errors", %{
    conn: conn,
    trace: trace
  } do
    tool_failure =
      conn
      |> modern_headers("tools/call", "flambe_start")
      |> post(~p"/mcp", %{
        "jsonrpc" => "2.0",
        "id" => 4,
        "method" => "tools/call",
        "params" => %{
          "name" => "flambe_start",
          "arguments" => %{"trace_id" => trace.id}
        }
      })

    assert %{
             "id" => 4,
             "result" => %{
               "isError" => true,
               "structuredContent" => %{"code" => "INVALID_INPUT"}
             }
           } = json_response(tool_failure, 200)

    bad_headers =
      tool_failure
      |> recycle()
      |> modern_headers("tools/list")
      |> post(~p"/mcp", %{"jsonrpc" => "2.0", "id" => 5, "method" => "tools/call"})

    assert %{"id" => 5, "error" => %{"code" => -32600}} = json_response(bad_headers, 400)

    unknown =
      tool_failure
      |> recycle()
      |> post(~p"/mcp", %{"jsonrpc" => "2.0", "id" => 6, "method" => "unknown/method"})

    assert %{"id" => 6, "error" => %{"code" => -32601}} = json_response(unknown, 200)

    unknown_tool =
      tool_failure
      |> recycle()
      |> post(~p"/mcp", %{
        "jsonrpc" => "2.0",
        "id" => 7,
        "method" => "tools/call",
        "params" => %{"name" => "not_a_tool", "arguments" => %{}}
      })

    assert %{"id" => 7, "error" => %{"code" => -32602}} = json_response(unknown_tool, 200)
  end

  test "accepts and persists direct MCP agent identity arguments", %{
    conn: conn,
    trace: trace,
    user: user
  } do
    conn =
      conn
      |> modern_headers("tools/call", "flambe_start")
      |> post(~p"/mcp", %{
        "jsonrpc" => "2.0",
        "id" => 10,
        "method" => "tools/call",
        "params" => %{
          "name" => "flambe_start",
          "arguments" => %{
            "trace_id" => trace.id,
            "name" => "Direct MCP identity",
            "agent_id" => "direct-mcp-agent",
            "agent_name" => "Direct Agent",
            "platform" => "MCP Host"
          }
        }
      })

    assert %{
             "result" => %{
               "isError" => false,
               "structuredContent" => %{"activity_id" => activity_id}
             }
           } = json_response(conn, 200)

    activity = Traces.get_user_activity!(user, activity_id)
    assert activity.agent_id == "direct-mcp-agent"
    assert activity.agent_name == "Direct Agent"

    assert %{name: "Direct Agent", platform: "MCP Host"} =
             Agents.get(user, "direct-mcp-agent")
  end

  test "supports ping and rejects malformed initialization parameters", %{conn: conn} do
    ping = post(conn, ~p"/mcp", %{"jsonrpc" => "2.0", "id" => 8, "method" => "ping"})
    assert json_response(ping, 200) == %{"jsonrpc" => "2.0", "id" => 8, "result" => %{}}

    malformed =
      ping
      |> recycle()
      |> post(~p"/mcp", %{"jsonrpc" => "2.0", "id" => 9, "method" => "initialize"})

    assert %{"id" => 9, "error" => %{"code" => -32602}} = json_response(malformed, 200)
  end

  test "rejects foreign origins", %{conn: conn} do
    conn =
      conn
      |> put_req_header("origin", "https://attacker.example")
      |> post(~p"/mcp", %{"jsonrpc" => "2.0", "id" => 7, "method" => "tools/list"})

    assert %{"id" => 7, "error" => %{"code" => -32600}} = json_response(conn, 403)
  end

  test "returns 405 for unsupported stream and session methods", %{conn: conn, user: user} do
    assert conn |> get(~p"/mcp") |> response(405) == ""

    assert conn |> recycle() |> authenticated_as(user) |> delete(~p"/mcp") |> response(405) == ""
  end

  defp modern_headers(conn, method, name \\ nil) do
    conn =
      conn
      |> put_req_header("mcp-protocol-version", "2026-07-28")
      |> put_req_header("mcp-method", method)

    if name, do: put_req_header(conn, "mcp-name", name), else: conn
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
