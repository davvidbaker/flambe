defmodule FlambeNextWeb.LiveEventStreamTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, Traces}
  alias FlambeNextWeb.Endpoint

  test "creating an activity broadcasts its beginning event", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Live User", username: "live-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Live trace"})
    thread = trace.id |> Traces.get_trace!() |> Map.fetch!(:threads) |> List.first()

    :ok = Endpoint.subscribe("events:#{user.id}")

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/activities", %{
        "trace_id" => trace.id,
        "thread_id" => thread.id,
        "activity" => %{
          "name" => "Stream agent work",
          "description" => "Visible without refreshing"
        },
        "event" => %{"timestamp_integer" => 1_723_465_600_123, "phase" => "B"}
      })

    assert %{"data" => %{"event" => %{"id" => event_id}}} = json_response(conn, 201)

    assert_receive %Phoenix.Socket.Broadcast{
      topic: topic,
      event: "timeline_event",
      payload: %{
        trace_id: trace_id,
        event: %{
          id: ^event_id,
          phase: "B",
          message: nil,
          timestamp: %DateTime{},
          activity: %{
            name: "Stream agent work",
            description: "Visible without refreshing",
            thread: %{id: thread_id},
            categories: []
          }
        }
      }
    }

    assert topic == "events:#{user.id}"
    assert trace_id == trace.id
    assert thread_id == thread.id
  end

  test "creating and updating an event broadcasts authoritative event state", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Live Event User", username: "live-event-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Live event trace"})
    thread = trace.id |> Traces.get_trace!() |> Map.fetch!(:threads) |> List.first()

    {:ok, activity, _begin_event} =
      Traces.create_activity(
        trace,
        thread,
        %{"name" => "Agent step"},
        %{"timestamp_integer" => 1_723_465_600_123, "phase" => "B"}
      )

    :ok = Endpoint.subscribe("events:#{user.id}")

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

    assert %{"data" => %{"id" => event_id}} = json_response(conn, 201)

    assert_receive %Phoenix.Socket.Broadcast{
      event: "timeline_event",
      payload: %{
        trace_id: trace_id,
        event: %{
          id: ^event_id,
          phase: "E",
          message: "Done",
          activity: %{id: activity_id}
        }
      }
    }

    assert trace_id == trace.id
    assert activity_id == activity.id

    conn =
      conn
      |> recycle()
      |> put(~p"/api/events/#{event_id}", %{"event" => %{"message" => "Really done"}})

    assert json_response(conn, 200)["data"]["id"] == event_id

    assert_receive %Phoenix.Socket.Broadcast{
      event: "timeline_event",
      payload: %{
        event: %{
          id: ^event_id,
          phase: "E",
          message: "Really done"
        }
      }
    }
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
