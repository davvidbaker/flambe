defmodule FlambeNextWeb.AgentMessageControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, Agents, Traces}

  setup %{conn: conn} do
    suffix = System.unique_integer([:positive])
    {:ok, user} = Accounts.create_user(%{name: "Inbox User", username: "inbox-user-#{suffix}"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Inbox trace"})
    {:ok, _} = Agents.identify(user, "agent-a", "Agent A")

    %{conn: authenticated_as(conn, user), user: user, trace: trace}
  end

  test "a UI message is delivered once, on the agent's next command", %{
    conn: conn,
    trace: trace
  } do
    sent =
      conn
      |> post(~p"/api/agents/agent-a/messages", %{
        "body" => " skip the tests ",
        "trace_id" => trace.id
      })
      |> json_response(201)

    assert %{"data" => %{"id" => id, "body" => "skip the tests", "delivered_at" => nil}} = sent

    status = fn ->
      conn
      |> post(~p"/api/agent-commands", %{
        "command" => "status",
        "arguments" => %{"trace_id" => trace.id, "agent_id" => "agent-a"}
      })
      |> json_response(200)
    end

    assert %{"data" => %{"inbox" => [%{"id" => ^id, "body" => "skip the tests"}]}} = status.()
    assert %{"data" => %{"inbox" => []}} = status.()

    assert %{"data" => [%{"id" => ^id, "delivered_at" => delivered}]} =
             conn |> get(~p"/api/agents/agent-a/messages") |> json_response(200)

    assert is_binary(delivered)
  end

  test "other agents do not receive the message", %{conn: conn, trace: trace} do
    post(conn, ~p"/api/agents/agent-a/messages", %{"body" => "hi"})

    assert %{"data" => %{"inbox" => []}} =
             conn
             |> post(~p"/api/agent-commands", %{
               "command" => "status",
               "arguments" => %{"trace_id" => trace.id, "agent_id" => "agent-b"}
             })
             |> json_response(200)
  end

  test "rejects unknown agents and blank bodies", %{conn: conn} do
    assert conn |> post(~p"/api/agents/nobody/messages", %{"body" => "hi"}) |> json_response(404)
    assert conn |> post(~p"/api/agents/agent-a/messages", %{"body" => "  "}) |> json_response(422)
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
