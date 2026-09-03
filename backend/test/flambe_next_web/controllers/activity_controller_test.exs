defmodule FlambeNextWeb.ActivityControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, Traces}

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

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
