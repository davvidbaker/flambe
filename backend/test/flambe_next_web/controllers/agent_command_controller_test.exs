defmodule FlambeNextWeb.AgentCommandControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, Traces}

  setup %{conn: conn} do
    suffix = System.unique_integer([:positive])

    {:ok, user} =
      Accounts.create_user(%{name: "Command User", username: "command-user-#{suffix}"})

    {:ok, trace} = Traces.create_trace(user, %{name: "Command trace"})

    %{conn: authenticated_as(conn, user), user: user, trace: trace}
  end

  test "advertises the versioned command API", %{conn: conn} do
    conn = get(conn, ~p"/api/agent-commands")

    assert json_response(conn, 200) == %{
             "data" => %{
               "version" => 1,
               "commands" => ["start", "end", "suspend", "resume", "status", "message"]
             }
           }
  end

  test "executes commands and gives request identity headers precedence", %{
    conn: conn,
    trace: trace,
    user: user
  } do
    conn =
      conn
      |> put_req_header("x-flambe-agent-id", "header-agent")
      |> put_req_header("x-flambe-agent-name", "Header Agent")
      |> post(~p"/api/agent-commands", %{
        "command" => "start",
        "arguments" => %{
          "trace_id" => trace.id,
          "name" => "Transport work",
          "agent_id" => "body-agent",
          "agent_name" => "Body Agent"
        }
      })

    assert %{
             "data" => %{
               "activity_id" => activity_id,
               "event_id" => event_id,
               "state" => %{"activities" => activities},
               "direction" => nil,
               "actions_applied" => [],
               "closed_descendants" => []
             }
           } = json_response(conn, 200)

    assert is_integer(event_id)

    assert Enum.any?(activities, fn activity ->
             activity["id"] == activity_id and activity["agentId"] == "header-agent"
           end)

    activity = Traces.get_user_activity!(user, activity_id)
    assert activity.agent_id == "header-agent"
    assert activity.agent_name == "Header Agent"
  end

  test "maps validation and authorization failures without leaking internals", %{
    conn: conn,
    trace: trace,
    user: user
  } do
    invalid =
      post(conn, ~p"/api/agent-commands", %{
        "command" => "start",
        "arguments" => %{"trace_id" => trace.id}
      })

    assert %{"error" => %{"code" => "INVALID_INPUT", "message" => message}} =
             json_response(invalid, 422)

    assert message =~ "name"

    missing =
      conn
      |> recycle()
      |> authenticated_as(user)
      |> post(~p"/api/agent-commands", %{
        "command" => "status",
        "arguments" => %{"trace_id" => 999_999_999}
      })

    assert json_response(missing, 404) == %{
             "error" => %{
               "code" => "NOT_FOUND",
               "message" => "The requested resource was not found"
             }
           }
  end

  test "requires authentication", %{conn: conn} do
    conn = conn |> recycle() |> get(~p"/api/agent-commands")
    assert json_response(conn, 401) == %{"error" => "UNAUTHENTICATED"}
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
