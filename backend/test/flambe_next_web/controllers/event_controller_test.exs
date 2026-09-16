defmodule FlambeNextWeb.EventControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, Traces}
  alias FlambeNext.Accounts.ApiTokens

  @t0 1_723_465_600_000

  setup %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Reducer User", username: "reducer-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Reducer trace"})
    trace = Traces.get_trace!(trace.id)
    [thread] = trace.threads

    root = start_activity(trace, thread, nil, "Ship feature", @t0)
    child = start_activity(trace, thread, root, "Fix bug", @t0 + 1_000)
    grandchild = start_activity(trace, thread, child, "Write failing test", @t0 + 2_000)
    done_child = start_activity(trace, thread, root, "Already finished", @t0 + 3_000)

    {:ok, _} =
      Traces.create_event(trace, done_child, %{"phase" => "E", "timestamp_integer" => @t0 + 4_000})

    suspended_child = start_activity(trace, thread, root, "Tabled", @t0 + 5_000)

    {:ok, _} =
      Traces.create_event(trace, suspended_child, %{
        "phase" => "S",
        "timestamp_integer" => @t0 + 6_000
      })

    {:ok, _api_token, raw_token} = ApiTokens.create(user, "Cursor")

    %{
      conn: conn,
      user: user,
      trace: trace,
      root: root,
      child: child,
      grandchild: grandchild,
      done_child: done_child,
      suspended_child: suspended_child,
      raw_token: raw_token
    }
  end

  test "an agent ending a parent also ends its open descendants, deepest first", ctx do
    conn =
      ctx.conn
      |> put_req_header("authorization", "Bearer #{ctx.raw_token}")
      |> post(~p"/api/events", %{
        "trace_id" => ctx.trace.id,
        "activity_id" => ctx.root.id,
        "event" => %{"phase" => "E", "timestamp_integer" => @t0 + 10_000, "message" => "Shipped"}
      })

    child_id = ctx.child.id
    grandchild_id = ctx.grandchild.id

    assert %{
             "data" => %{
               "id" => root_end_id,
               "phase" => "E",
               "reducer" => %{
                 "closed_descendants" => [
                   %{
                     "activity_id" => ^grandchild_id,
                     "activity_name" => "Write failing test",
                     "event_id" => grandchild_end_id
                   },
                   %{
                     "activity_id" => ^child_id,
                     "activity_name" => "Fix bug",
                     "event_id" => child_end_id
                   }
                 ]
               }
             }
           } = json_response(conn, 201)

    assert grandchild_end_id < child_end_id and child_end_id < root_end_id

    latest = latest_phases(ctx.user, ctx.trace.id)
    assert latest[ctx.root.id] == {"E", "Shipped"}

    assert latest[ctx.child.id] ==
             {"E", "Ended by reducer: parent activity #{ctx.root.id} (Ship feature) ended"}

    assert {"E", "Ended by reducer: " <> _} = latest[ctx.grandchild.id]
    assert {"E", nil} = latest[ctx.done_child.id]
    assert {"S", nil} = latest[ctx.suspended_child.id]

    closing_events =
      events(ctx.user, ctx.trace.id)
      |> Enum.filter(&(&1.phase == "E" and &1.activity_id in [ctx.child.id, ctx.grandchild.id]))

    assert length(closing_events) == 2

    assert Enum.all?(
             closing_events,
             &(DateTime.to_unix(&1.timestamp, :millisecond) == @t0 + 10_000)
           )
  end

  test "an agent ending a leaf records only that event", ctx do
    conn =
      ctx.conn
      |> put_req_header("authorization", "Bearer #{ctx.raw_token}")
      |> post(~p"/api/events", %{
        "trace_id" => ctx.trace.id,
        "activity_id" => ctx.grandchild.id,
        "event" => %{"phase" => "E", "timestamp_integer" => @t0 + 10_000}
      })

    assert %{"data" => data} = json_response(conn, 201)
    refute Map.has_key?(data, "reducer")
    assert {"B", nil} = latest_phases(ctx.user, ctx.trace.id)[ctx.child.id]
  end

  test "suspending a parent from an agent does not touch descendants", ctx do
    conn =
      ctx.conn
      |> put_req_header("authorization", "Bearer #{ctx.raw_token}")
      |> post(~p"/api/events", %{
        "trace_id" => ctx.trace.id,
        "activity_id" => ctx.root.id,
        "event" => %{"phase" => "S", "timestamp_integer" => @t0 + 10_000}
      })

    assert %{"data" => %{"phase" => "S"} = data} = json_response(conn, 201)
    refute Map.has_key?(data, "reducer")
    assert {"B", nil} = latest_phases(ctx.user, ctx.trace.id)[ctx.child.id]
  end

  test "a human ending a parent from the SPA writes directly and leaves children alone", ctx do
    conn =
      ctx.conn
      |> init_test_session(%{})
      |> put_session(:user_id, ctx.user.id)
      |> post(~p"/api/events", %{
        "trace_id" => ctx.trace.id,
        "activity_id" => ctx.root.id,
        "event" => %{"phase" => "E", "timestamp_integer" => @t0 + 10_000}
      })

    assert %{"data" => %{"phase" => "E"} = data} = json_response(conn, 201)
    refute Map.has_key?(data, "reducer")
    assert {"B", nil} = latest_phases(ctx.user, ctx.trace.id)[ctx.child.id]
  end

  test "an invalid proposed event writes nothing, including descendant closures", ctx do
    conn =
      ctx.conn
      |> put_req_header("authorization", "Bearer #{ctx.raw_token}")
      |> post(~p"/api/events", %{
        "trace_id" => ctx.trace.id,
        "activity_id" => ctx.root.id,
        "event" => %{"phase" => "E"}
      })

    assert %{"errors" => %{"timestamp" => _}} = json_response(conn, 422)
    assert {"B", nil} = latest_phases(ctx.user, ctx.trace.id)[ctx.child.id]
    assert {"B", nil} = latest_phases(ctx.user, ctx.trace.id)[ctx.root.id]
  end

  test "agent-commands end closes the same open descendants as bearer REST", ctx do
    grandchild_id = ctx.grandchild.id

    conn =
      ctx.conn
      |> put_req_header("authorization", "Bearer #{ctx.raw_token}")
      |> post(~p"/api/agent-commands", %{
        "command" => "end",
        "arguments" => %{
          "trace_id" => ctx.trace.id,
          "activity_id" => ctx.child.id,
          "timestamp" => @t0 + 20_000,
          "force" => true,
          "message" => "Done via commands"
        }
      })

    assert %{
             "data" => %{
               "closed_descendants" => [%{"activity_id" => ^grandchild_id}],
               "direction" => nil,
               "reply" => nil,
               "rules_fired" => []
             }
           } = json_response(conn, 200)

    child_id = ctx.child.id
    expected = "Ended by reducer: parent activity #{child_id} (Fix bug) ended"

    assert {"E", "Done via commands"} = latest_phases(ctx.user, ctx.trace.id)[child_id]
    assert {"E", ^expected} = latest_phases(ctx.user, ctx.trace.id)[grandchild_id]
  end

  defp start_activity(trace, thread, parent, name, timestamp) do
    {:ok, activity, _event} =
      Traces.create_activity(trace, thread, parent, %{"name" => name}, %{
        "phase" => "B",
        "timestamp_integer" => timestamp
      })

    activity
  end

  defp events(user, trace_id) do
    {_trace, events} = Traces.get_user_trace_with_events!(user, trace_id)
    events
  end

  defp latest_phases(user, trace_id) do
    events(user, trace_id)
    |> Enum.sort_by(&{DateTime.to_unix(&1.timestamp, :microsecond), &1.id})
    |> Enum.reduce(%{}, fn event, acc ->
      Map.put(acc, event.activity_id, {event.phase, event.message})
    end)
  end
end
