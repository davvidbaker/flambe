defmodule FlambeNextWeb.ActivityControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, Traces}
  alias FlambeNext.Accounts.ApiTokens

  test "creates a timeline activity and returns it in the legacy trace payload", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Timeline User", username: "timeline-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Timeline trace"})
    thread = trace.id |> Traces.get_trace!() |> Map.fetch!(:threads) |> List.first()

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/activities", %{
        "trace_id" => trace.id,
        "thread_id" => thread.id,
        "activity" => %{
          "name" => "Ship Phoenix migration",
          "description" => "API contract",
          "weight" => 3
        },
        "event" => %{"timestamp_integer" => 1_723_465_600_123, "phase" => "B"}
      })

    assert %{
             "data" => %{
               "activity" => %{
                 "description" => "API contract",
                 "id" => activity_id,
                 "name" => "Ship Phoenix migration",
                 "weight" => 3
               },
               "event" => %{"id" => event_id, "phase" => "B"}
             }
           } = json_response(conn, 201)

    conn = conn |> recycle() |> get(~p"/api/traces/#{trace}")

    assert %{
             "data" => %{
               "events" => [
                 %{
                   "activity" => %{
                     "categories" => [],
                     "id" => ^activity_id,
                     "name" => "Ship Phoenix migration",
                     "thread" => %{"id" => thread_id},
                     "weight" => 3
                   },
                   "id" => ^event_id,
                   "message" => nil,
                   "phase" => "B",
                   "timestamp" => "2024-08-12T12:26:40.123000Z"
                 }
               ]
             }
           } = json_response(conn, 200)

    assert thread_id == thread.id
  end

  test "attributes an activity to the requesting agent instance", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Agent User", username: "agent-instance-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Agent trace"})
    [thread] = Traces.get_trace!(trace.id).threads

    conn =
      conn
      |> authenticated_as(user)
      |> put_req_header("x-flambe-agent-id", "codex-instance-42")
      |> post(~p"/api/activities", %{
        "trace_id" => trace.id,
        "thread_id" => thread.id,
        "activity" => %{"name" => "Investigate concurrent flames"},
        "event" => %{"timestamp_integer" => 1_723_465_600_123, "phase" => "B"}
      })

    assert %{"data" => %{"activity" => %{"id" => activity_id}}} = json_response(conn, 201)

    conn = conn |> recycle() |> get(~p"/api/traces/#{trace}")

    assert %{
             "data" => %{
               "events" => [
                 %{
                   "activity" => %{
                     "agent_id" => "codex-instance-42",
                     "agent_name" => agent_name,
                     "id" => ^activity_id
                   }
                 }
               ]
             }
           } = json_response(conn, 200)

    assert agent_name in ~w(Steve Belinda Juniper Marcel Priya Otis Nia Theo Carmen Felix Imani Rory Greta Miles Suki)
  end

  test "uses the agent display name from the request when present", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Named Agent User", username: "named-agent-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Named agent trace"})
    [thread] = Traces.get_trace!(trace.id).threads

    conn =
      conn
      |> authenticated_as(user)
      |> put_req_header("x-flambe-agent-id", "cursor:conv-1")
      |> put_req_header("x-flambe-agent-name", "Grok")
      |> post(~p"/api/activities", %{
        "trace_id" => trace.id,
        "thread_id" => thread.id,
        "activity" => %{"name" => "Identify CLI agents by name"},
        "event" => %{"timestamp_integer" => 1_723_465_600_123, "phase" => "B"}
      })

    assert %{"data" => %{"activity" => %{"id" => activity_id}}} = json_response(conn, 201)

    conn = conn |> recycle() |> get(~p"/api/traces/#{trace}")

    assert %{
             "data" => %{
               "events" => [
                 %{
                   "activity" => %{
                     "agent_id" => "cursor:conv-1",
                     "agent_name" => "Grok",
                     "id" => ^activity_id
                   }
                 }
               ]
             }
           } = json_response(conn, 200)
  end

  test "falls back to the API token name when the agent omits a display name", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Token Agent User", username: "token-agent-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Token agent trace"})
    [thread] = Traces.get_trace!(trace.id).threads
    {:ok, _api_token, raw_token} = ApiTokens.create(user, "Claude")

    conn =
      conn
      |> put_req_header("authorization", "Bearer #{raw_token}")
      |> put_req_header("x-flambe-agent-id", "cursor:conv-2")
      |> post(~p"/api/activities", %{
        "trace_id" => trace.id,
        "thread_id" => thread.id,
        "activity" => %{"name" => "Inspect auth"},
        "event" => %{"timestamp_integer" => 1_723_465_600_123, "phase" => "B"}
      })

    assert %{"data" => %{"activity" => %{"id" => activity_id}}} = json_response(conn, 201)

    conn = conn |> recycle() |> get(~p"/api/traces/#{trace}")

    assert %{
             "data" => %{
               "events" => [
                 %{
                   "activity" => %{
                     "agent_id" => "cursor:conv-2",
                     "agent_name" => "Claude",
                     "id" => ^activity_id
                   }
                 }
               ]
             }
           } = json_response(conn, 200)
  end

  test "ignores agent identity fields in the activity body", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Body Agent User", username: "body-agent-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Body agent trace"})
    [thread] = Traces.get_trace!(trace.id).threads

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/activities", %{
        "trace_id" => trace.id,
        "thread_id" => thread.id,
        "activity" => %{
          "name" => "Spoofed identity",
          "agent_id" => "evil",
          "agent_name" => "Evil"
        },
        "event" => %{"timestamp_integer" => 1_723_465_600_123, "phase" => "B"}
      })

    assert %{"data" => %{"activity" => %{"id" => activity_id}}} = json_response(conn, 201)

    conn = conn |> recycle() |> get(~p"/api/traces/#{trace}")

    assert %{
             "data" => %{
               "events" => [
                 %{
                   "activity" => %{
                     "agent_id" => nil,
                     "agent_name" => nil,
                     "id" => ^activity_id
                   }
                 }
               ]
             }
           } = json_response(conn, 200)
  end

  test "adds an event only to an activity in the signed-in user's trace", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Event User", username: "event-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Event trace"})
    thread = trace.id |> Traces.get_trace!() |> Map.fetch!(:threads) |> List.first()

    {:ok, activity, _event} =
      Traces.create_activity(
        trace,
        thread,
        nil,
        %{"name" => "Open activity"},
        %{"timestamp_integer" => 1_723_465_600_123, "phase" => "B"}
      )

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/events", %{
        "trace_id" => trace.id,
        "activity_id" => activity.id,
        "event" => %{
          "timestamp_integer" => 1_723_465_900_123,
          "message" => "Done",
          "phase" => "E"
        }
      })

    assert %{"data" => %{"id" => event_id, "phase" => "E"}} = json_response(conn, 201)
    assert is_integer(event_id)
  end

  test "creates a child only under an activity in the same trace and thread", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Tree User", username: "tree-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Tree trace"})
    [thread] = Traces.get_trace!(trace.id).threads

    {:ok, parent, _event} =
      Traces.create_activity(
        trace,
        thread,
        nil,
        %{"name" => "Root"},
        %{"timestamp_integer" => 1, "phase" => "B"}
      )

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/activities", %{
        "trace_id" => trace.id,
        "thread_id" => thread.id,
        "activity" => %{"name" => "Child", "parent_id" => parent.id},
        "event" => %{"timestamp_integer" => 2, "phase" => "B"}
      })

    assert %{"data" => %{"activity" => %{"parent_id" => parent_id}}} = json_response(conn, 201)
    assert parent_id == parent.id

    {:ok, other_thread} = Traces.create_thread(trace, %{name: "Other", rank: 1})

    conn =
      conn
      |> recycle()
      |> post(~p"/api/activities", %{
        "trace_id" => trace.id,
        "thread_id" => other_thread.id,
        "activity" => %{"name" => "Invalid child", "parent_id" => parent.id},
        "event" => %{"timestamp_integer" => 3, "phase" => "B"}
      })

    assert json_response(conn, 404) == %{"error" => "NOT_FOUND"}
  end

  test "updates and deletes an activity and updates its event", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Lifecycle User", username: "lifecycle-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Lifecycle trace"})
    thread = trace.id |> Traces.get_trace!() |> Map.fetch!(:threads) |> List.first()

    {:ok, activity, event} =
      Traces.create_activity(
        trace,
        thread,
        nil,
        %{"name" => "Draft", "weight" => 1},
        %{"timestamp_integer" => 1_723_465_600_123, "phase" => "B"}
      )

    conn =
      conn
      |> authenticated_as(user)
      |> put(~p"/api/activities/#{activity}", %{"activity" => %{"name" => "Final", "weight" => 2}})

    assert json_response(conn, 200) == %{
             "data" => %{
               "description" => nil,
               "id" => activity.id,
               "name" => "Final",
               "parent_id" => nil,
               "thread_id" => thread.id,
               "weight" => 2
             }
           }

    conn =
      conn
      |> recycle()
      |> put(~p"/api/events/#{event}", %{"event" => %{"message" => "Done", "phase" => "E"}})

    assert json_response(conn, 200) == %{"data" => %{"id" => event.id, "phase" => "E"}}

    conn = conn |> recycle() |> get(~p"/api/traces/#{trace}")

    assert %{"data" => %{"events" => [%{"message" => "Done", "phase" => "E"}]}} =
             json_response(conn, 200)

    conn = conn |> recycle() |> delete(~p"/api/events/#{event}")
    assert response(conn, 204) == ""

    conn = conn |> recycle() |> get(~p"/api/traces/#{trace}")
    assert %{"data" => %{"events" => []}} = json_response(conn, 200)

    conn = conn |> recycle() |> delete(~p"/api/activities/#{activity}")
    assert response(conn, 204) == ""
  end

  test "moves an activity subtree onto another thread in the same trace", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Move User", username: "move-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Move trace"})
    [thread] = Traces.get_trace!(trace.id).threads
    {:ok, other} = Traces.create_thread(trace, %{name: "Other", rank: 1})

    {:ok, parent, _} =
      Traces.create_activity(
        trace,
        thread,
        nil,
        %{"name" => "Parent"},
        %{"timestamp_integer" => 1, "phase" => "B"}
      )

    {:ok, child, _} =
      Traces.create_activity(
        trace,
        thread,
        parent,
        %{"name" => "Child"},
        %{"timestamp_integer" => 2, "phase" => "B"}
      )

    {:ok, grand, _} =
      Traces.create_activity(
        trace,
        thread,
        child,
        %{"name" => "Grand"},
        %{"timestamp_integer" => 3, "phase" => "B"}
      )

    conn =
      conn
      |> authenticated_as(user)
      |> put(~p"/api/activities/#{parent}", %{"activity" => %{"thread_id" => other.id}})

    assert %{
             "data" => %{
               "id" => parent_id,
               "thread_id" => moved_thread_id,
               "parent_id" => nil
             }
           } = json_response(conn, 200)

    assert parent_id == parent.id
    assert moved_thread_id == other.id
    assert Traces.get_user_activity!(user, child.id).thread_id == other.id
    assert Traces.get_user_activity!(user, grand.id).thread_id == other.id
    assert Traces.get_user_activity!(user, child.id).parent_id == parent.id
    assert Traces.get_user_activity!(user, grand.id).parent_id == child.id
  end

  test "rejects moving an activity onto a thread from another trace", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Cross User", username: "cross-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Home"})
    {:ok, other_trace} = Traces.create_trace(user, %{name: "Away"})
    [thread] = Traces.get_trace!(trace.id).threads
    [foreign] = Traces.get_trace!(other_trace.id).threads

    {:ok, activity, _} =
      Traces.create_activity(
        trace,
        thread,
        nil,
        %{"name" => "Stay put"},
        %{"timestamp_integer" => 1, "phase" => "B"}
      )

    conn =
      conn
      |> authenticated_as(user)
      |> put(~p"/api/activities/#{activity}", %{"activity" => %{"thread_id" => foreign.id}})

    assert json_response(conn, 404) == %{"error" => "NOT_FOUND"}
    assert Traces.get_user_activity!(user, activity.id).thread_id == thread.id
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
