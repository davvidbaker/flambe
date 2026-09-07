defmodule FlambeNextWeb.ReducerStartTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, Traces}
  alias FlambeNext.Accounts.ApiTokens

  @t0 1_723_465_600_000

  setup %{conn: conn} do
    {:ok, user} =
      Accounts.create_user(%{
        name: "Start User",
        username: "start-user-#{System.unique_integer([:positive])}"
      })

    {:ok, trace} = Traces.create_trace(user, %{name: "Start trace"})
    trace = Traces.get_trace!(trace.id)
    [main] = trace.threads
    {:ok, side} = Traces.create_thread(trace, %{"name" => "Side project", "rank" => 1})

    {:ok, category} =
      Accounts.create_category(user, [], %{"name" => "Backend", "color_background" => "#000"})

    {:ok, _token, raw_token} = ApiTokens.create(user, "Cursor")

    %{
      conn: conn,
      user: user,
      trace: trace,
      main: main,
      side: side,
      category: category,
      raw_token: raw_token
    }
  end

  defp as_agent(conn, ctx, agent_id) do
    conn
    |> put_req_header("authorization", "Bearer #{ctx.raw_token}")
    |> put_req_header("x-flambe-agent-id", agent_id)
  end

  defp start(conn, ctx, body) do
    conn
    |> post(
      ~p"/api/activities",
      Map.merge(
        %{"trace_id" => ctx.trace.id, "event" => %{"timestamp_integer" => @t0, "phase" => "B"}},
        body
      )
    )
    |> json_response(201)
  end

  test "an agent's first start without a parent is a root on the default thread", ctx do
    %{"data" => data} =
      ctx.conn |> as_agent(ctx, "a") |> start(ctx, %{"activity" => %{"name" => "Root"}})

    assert data["activity"]["parent_id"] == nil
    assert data["activity"]["thread_id"] == ctx.main.id

    assert data["reducer"] == %{
             "parent_source" => "root",
             "thread_source" => "default",
             "categories_source" => "none"
           }
  end

  test "parent inference is scoped to the calling agent", ctx do
    %{"data" => %{"activity" => %{"id" => other_root}}} =
      ctx.conn
      |> as_agent(ctx, "other")
      |> start(ctx, %{"activity" => %{"name" => "Other agent's work"}})

    %{"data" => mine} =
      ctx.conn
      |> as_agent(ctx, "me")
      |> start(ctx, %{"activity" => %{"name" => "My first thing"}})

    assert mine["activity"]["parent_id"] == nil
    assert mine["reducer"]["parent_source"] == "root"

    %{"data" => nested} =
      ctx.conn
      |> as_agent(ctx, "me")
      |> start(ctx, %{"activity" => %{"name" => "My nested thing"}})

    assert nested["activity"]["parent_id"] == mine["activity"]["id"]
    assert nested["reducer"]["parent_source"] == "inferred"
    refute nested["activity"]["parent_id"] == other_root
  end

  test "a child follows its parent's thread and inherits categories when none are given", ctx do
    %{"data" => %{"activity" => %{"id" => parent_id}}} =
      ctx.conn
      |> as_agent(ctx, "a")
      |> start(ctx, %{
        "thread_id" => ctx.side.id,
        "activity" => %{
          "name" => "Side root",
          "parent_id" => nil,
          "categories" => [ctx.category.id]
        }
      })

    %{"data" => child} =
      ctx.conn
      |> as_agent(ctx, "a")
      |> start(ctx, %{"thread_id" => ctx.main.id, "activity" => %{"name" => "Child"}})

    assert child["activity"]["parent_id"] == parent_id
    assert child["activity"]["thread_id"] == ctx.side.id

    assert child["reducer"] == %{
             "parent_source" => "inferred",
             "thread_source" => "parent",
             "categories_source" => "parent"
           }

    activity = Traces.get_user_activity!(ctx.user, child["activity"]["id"])
    assert Enum.map(activity.categories, & &1.id) == [ctx.category.id]
  end

  test "an explicit null parent starts a new root even while the agent has open work", ctx do
    ctx.conn |> as_agent(ctx, "a") |> start(ctx, %{"activity" => %{"name" => "Open work"}})

    %{"data" => root} =
      ctx.conn
      |> as_agent(ctx, "a")
      |> start(ctx, %{"activity" => %{"name" => "New root", "parent_id" => nil}})

    assert root["activity"]["parent_id"] == nil
    assert root["reducer"]["parent_source"] == "root"
  end

  test "an ended parent is not inferred; a reducer annotation does not close it either", ctx do
    %{"data" => %{"activity" => %{"id" => first}}} =
      ctx.conn |> as_agent(ctx, "a") |> start(ctx, %{"activity" => %{"name" => "First"}})

    trace = Traces.get_user_trace!(ctx.user, ctx.trace.id)
    activity = Traces.get_user_trace_activity!(ctx.user, trace.id, first)

    {:ok, _} =
      Traces.create_event(trace, activity, %{
        "phase" => "reducer_decision",
        "message" => "note",
        "timestamp_integer" => @t0 + 1
      })

    %{"data" => still_nested} =
      ctx.conn |> as_agent(ctx, "a") |> start(ctx, %{"activity" => %{"name" => "Second"}})

    assert still_nested["activity"]["parent_id"] == first

    {:ok, _} =
      Traces.create_event(trace, activity, %{"phase" => "E", "timestamp_integer" => @t0 + 2})

    second = Traces.get_user_trace_activity!(ctx.user, trace.id, still_nested["activity"]["id"])

    {:ok, _} =
      Traces.create_event(trace, second, %{"phase" => "E", "timestamp_integer" => @t0 + 3})

    %{"data" => fresh} =
      ctx.conn |> as_agent(ctx, "a") |> start(ctx, %{"activity" => %{"name" => "Third"}})

    assert fresh["activity"]["parent_id"] == nil
  end

  test "an unknown explicit parent or thread is rejected", ctx do
    conn = ctx.conn |> as_agent(ctx, "a")

    assert %{"error" => "NOT_FOUND"} =
             conn
             |> post(~p"/api/activities", %{
               "trace_id" => ctx.trace.id,
               "activity" => %{"name" => "Orphan", "parent_id" => 999_999},
               "event" => %{"timestamp_integer" => @t0, "phase" => "B"}
             })
             |> json_response(404)

    assert %{"error" => "NOT_FOUND"} =
             conn
             |> post(~p"/api/activities", %{
               "trace_id" => ctx.trace.id,
               "thread_id" => 999_999,
               "activity" => %{"name" => "Lost", "parent_id" => nil},
               "event" => %{"timestamp_integer" => @t0, "phase" => "B"}
             })
             |> json_response(404)
  end

  test "a human posting from the SPA is written exactly as sent", ctx do
    ctx.conn |> as_agent(ctx, "a") |> start(ctx, %{"activity" => %{"name" => "Agent work"}})

    %{"data" => data} =
      ctx.conn
      |> init_test_session(%{})
      |> put_session(:user_id, ctx.user.id)
      |> start(ctx, %{"thread_id" => ctx.main.id, "activity" => %{"name" => "Human root"}})

    assert data["activity"]["parent_id"] == nil
    refute Map.has_key?(data, "reducer")
  end

  test "GET /api/agents/me reports the caller's assigned name", ctx do
    conn =
      ctx.conn
      |> as_agent(ctx, "cursor:me")
      |> put_req_header("x-flambe-agent-platform", "Cursor Cloud")
      |> get(~p"/api/agents/me")

    assert %{
             "data" => %{
               "agent_id" => "cursor:me",
               "name" => name,
               "platform" => "Cursor Cloud",
               "name_assigned" => true
             }
           } = json_response(conn, 200)

    assert [^name] = get_resp_header(conn, "x-flambe-agent-name")

    conn = ctx.conn |> as_agent(ctx, "cursor:me") |> get(~p"/api/agents/me")

    assert %{"data" => %{"name" => ^name, "platform" => "Cursor Cloud", "name_assigned" => false}} =
             json_response(conn, 200)

    conn =
      ctx.conn
      |> put_req_header("authorization", "Bearer #{ctx.raw_token}")
      |> get(~p"/api/agents/me")

    assert %{"error" => "AGENT_ID_REQUIRED"} = json_response(conn, 400)
  end
end
