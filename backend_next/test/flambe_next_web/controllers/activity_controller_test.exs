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

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
