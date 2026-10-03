defmodule FlambeNextWeb.McpControllerTest do
  use FlambeNextWeb.ConnCase, async: false

  alias FlambeNext.{Accounts, Agents, Traces}
  alias FlambeNext.Accounts.ApiTokens
  alias FlambeNextWeb.Endpoint

  @protocol_version "2026-07-28"

  setup %{conn: conn} do
    suffix = System.unique_integer([:positive])
    {:ok, user} = Accounts.create_user(%{name: "MCP User", username: "mcp-user-#{suffix}"})
    {:ok, trace} = Traces.create_trace(user, %{name: "MCP trace"})
    {:ok, _api_token, raw_token} = ApiTokens.create(user, "MCP test")

    conn = put_req_header(conn, "authorization", "Bearer #{raw_token}")
    %{conn: conn, trace: trace, user: user}
  end

  test "requires an API token and rejects a browser session", %{user: user} do
    unauthenticated = post_mcp(build_conn(), legacy_initialize())
    assert %{"error" => "UNAUTHENTICATED"} = json_response(unauthenticated, 401)

    session_only =
      build_conn()
      |> init_test_session(%{user_id: user.id})
      |> post_mcp(legacy_initialize())

    assert %{"error" => "UNAUTHENTICATED"} = json_response(session_only, 401)
  end

  test "supports legacy initialization during the compatibility window", %{conn: conn} do
    response = conn |> legacy_accept() |> post_mcp(legacy_initialize())

    assert %{
             "jsonrpc" => "2.0",
             "id" => 1,
             "result" => %{
               "protocolVersion" => protocol_version,
               "capabilities" => %{"tools" => _tools}
             }
           } = json_response(response, 200)

    assert protocol_version in ~w(2025-11-25 2025-06-18 2025-03-26)
  end

  test "discovers the modern protocol and all agent tools", %{conn: conn} do
    discovered = modern_post(conn, "server/discover", %{}, "discover")

    assert %{
             "result" => %{
               "resultType" => "complete",
               "supportedVersions" => supported,
               "capabilities" => %{"tools" => %{}}
             }
           } = json_response(discovered, 200)

    assert @protocol_version in supported

    listed = modern_post(recycle(discovered), "tools/list", %{}, 2)

    assert %{"result" => %{"resultType" => "complete", "tools" => tools}} =
             json_response(listed, 200)

    assert Enum.map(tools, & &1["name"]) == [
             "flambe_end",
             "flambe_message",
             "flambe_plan",
             "flambe_resume",
             "flambe_start",
             "flambe_status",
             "flambe_suspend",
             "flambe_traces"
           ]

    status = Enum.find(tools, &(&1["name"] == "flambe_status"))
    assert status["annotations"]["readOnlyHint"]
    assert get_in(status, ["inputSchema", "required"]) == ["trace_id"]

    traces = Enum.find(tools, &(&1["name"] == "flambe_traces"))
    assert traces["annotations"]["readOnlyHint"]
    assert get_in(traces, ["inputSchema", "required"]) == []

    Enum.each(tools, fn tool ->
      annotations = tool["annotations"]
      assert is_boolean(annotations["readOnlyHint"])
      assert is_boolean(annotations["destructiveHint"])
      assert is_boolean(annotations["openWorldHint"])
    end)

    for name <- ~w(flambe_start flambe_plan flambe_message) do
      assert Enum.find(tools, &(&1["name"] == name))["annotations"]["openWorldHint"]
    end

    for name <- ~w(flambe_end flambe_suspend flambe_resume) do
      refute Enum.find(tools, &(&1["name"] == name))["annotations"]["openWorldHint"]
    end
  end

  test "executes tools with structured results and authenticated header identity", %{
    conn: conn,
    trace: trace,
    user: user
  } do
    :ok = Endpoint.subscribe("events:#{trace.user_id}")

    called =
      conn
      |> put_req_header("x-flambe-agent-id", "mcp-header-agent")
      |> put_req_header("x-flambe-agent-name", "MCP Header Agent")
      |> modern_post(
        "tools/call",
        %{
          "name" => "flambe_start",
          "arguments" => %{
            "trace_id" => trace.id,
            "name" => "Called over MCP",
            "agent_id" => "body-agent"
          }
        },
        3,
        "flambe_start"
      )

    assert %{
             "result" => %{
               "resultType" => "complete",
               "isError" => false,
               "content" => [%{"type" => "text", "text" => text}],
               "structuredContent" => %{
                 "activity_id" => activity_id,
                 "state" => %{"activities" => activities}
               }
             }
           } = json_response(called, 200)

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
      build_conn()
      |> authenticated_as(user)
      |> post(~p"/api/agent-commands", %{
        "command" => "status",
        "arguments" => %{"trace_id" => trace.id}
      })

    structured_state =
      get_in(json_response(called, 200), ["result", "structuredContent", "state"])

    assert %{"data" => %{"state" => ^structured_state}} = json_response(status, 200)
  end

  test "returns command failures as tool errors and protocol failures as JSON-RPC errors", %{
    conn: conn,
    trace: trace
  } do
    tool_failure =
      modern_post(
        conn,
        "tools/call",
        %{"name" => "flambe_start", "arguments" => %{"trace_id" => trace.id}},
        4,
        "flambe_start"
      )

    assert %{
             "result" => %{
               "isError" => true,
               "structuredContent" => %{"code" => "INVALID_INPUT"}
             }
           } = json_response(tool_failure, 200)

    bad_headers =
      conn
      |> modern_headers("tools/list")
      |> put_req_header("mcp-method", "tools/call")
      |> post_mcp(modern_request("tools/list", %{}, 5))

    assert %{"error" => %{"code" => -32020}} = json_response(bad_headers, 400)

    unknown = modern_post(recycle(tool_failure), "unknown/method", %{}, 6)
    assert %{"error" => %{"code" => -32601}} = json_response(unknown, 404)
  end

  test "accepts direct MCP agent identity arguments when no identity header is present", %{
    conn: conn,
    trace: trace,
    user: user
  } do
    response =
      modern_post(
        conn,
        "tools/call",
        %{
          "name" => "flambe_start",
          "arguments" => %{
            "trace_id" => trace.id,
            "name" => "Direct MCP identity",
            "agent_id" => "direct-mcp-agent",
            "agent_name" => "Direct Agent",
            "platform" => "MCP Host"
          }
        },
        10,
        "flambe_start"
      )

    assert %{"result" => %{"structuredContent" => %{"activity_id" => activity_id}}} =
             json_response(response, 200)

    activity = Traces.get_user_activity!(user, activity_id)
    assert activity.agent_id == "direct-mcp-agent"
    assert activity.agent_name == "Direct Agent"
    assert %{name: "Direct Agent", platform: "MCP Host"} = Agents.get(user, "direct-mcp-agent")
  end

  test "rejects foreign origins and unsupported hosts", %{conn: conn} do
    foreign_origin =
      conn
      |> put_req_header("origin", "https://attacker.example")
      |> modern_post("tools/list", %{}, 7)

    assert response(foreign_origin, 403)

    foreign_host =
      conn
      |> recycle()
      |> Map.put(:host, "attacker.example")
      |> modern_post("tools/list", %{}, 8)

    assert response(foreign_host, 421)
  end

  test "does not expose legacy GET and DELETE transports", %{conn: conn} do
    assert conn |> get(~p"/mcp") |> response(404)
    assert conn |> recycle() |> delete(~p"/mcp") |> response(400)
  end

  defp modern_post(conn, method, params, id, name \\ nil) do
    conn
    |> modern_headers(method, name)
    |> post_mcp(modern_request(method, params, id))
  end

  defp modern_request(method, params, id) do
    %{
      "jsonrpc" => "2.0",
      "id" => id,
      "method" => method,
      "params" => Map.put(params, "_meta", modern_meta())
    }
  end

  defp modern_meta do
    %{
      "io.modelcontextprotocol/protocolVersion" => @protocol_version,
      "io.modelcontextprotocol/clientInfo" => %{"name" => "flambe-test", "version" => "1"},
      "io.modelcontextprotocol/clientCapabilities" => %{}
    }
  end

  defp modern_headers(conn, method, name \\ nil) do
    conn =
      conn
      |> put_req_header("accept", "application/json, text/event-stream")
      |> put_req_header("mcp-protocol-version", @protocol_version)
      |> put_req_header("mcp-method", method)

    if name, do: put_req_header(conn, "mcp-name", name), else: conn
  end

  defp legacy_initialize do
    %{
      "jsonrpc" => "2.0",
      "id" => 1,
      "method" => "initialize",
      "params" => %{
        "protocolVersion" => "2025-11-25",
        "capabilities" => %{},
        "clientInfo" => %{"name" => "test", "version" => "1"}
      }
    }
  end

  defp legacy_accept(conn) do
    put_req_header(conn, "accept", "application/json, text/event-stream")
  end

  defp post_mcp(conn, payload) do
    conn
    |> put_req_header("content-type", "application/json")
    |> post(~p"/mcp", Jason.encode!(payload))
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
