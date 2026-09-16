defmodule FlambeNext.ReducerPlacementTest do
  use FlambeNext.DataCase, async: false

  @moduletag :capture_log

  alias FlambeNext.{Accounts, Traces}
  alias FlambeNext.Reducer.Placement

  setup do
    key = System.get_env("OPENAI_API_KEY")
    System.delete_env("OPENAI_API_KEY")
    on_exit(fn -> if key, do: System.put_env("OPENAI_API_KEY", key) end)

    {:ok, user} =
      Accounts.create_user(%{
        name: "Place User",
        username: "place-user-#{System.unique_integer([:positive])}"
      })

    {:ok, trace} = Traces.create_trace(user, %{name: "Place trace"})
    trace = Traces.get_trace!(trace.id)
    [thread] = trace.threads

    {:ok, root, _event} =
      Traces.create_activity(trace, thread, nil, %{"name" => "Root"}, %{
        "phase" => "B",
        "timestamp_integer" => 1_723_465_600_000
      })

    %{user: user, trace: trace, thread: thread, root: root}
  end

  test "does nothing without a model key", %{user: user, root: root} do
    assert Placement.place_root_async(user, root) == :skipped
  end

  test "does nothing for non-roots", %{user: user, trace: trace, thread: thread, root: root} do
    System.put_env("OPENAI_API_KEY", "test-key")

    {:ok, child, _} =
      Traces.create_activity(trace, thread, root, %{"name" => "Child"}, %{
        "phase" => "B",
        "timestamp_integer" => 1_723_465_600_001
      })

    assert Placement.place_root_async(user, child) == :skipped
  end

  test "skips the model when there is only one thread and no categories", %{
    user: user,
    root: root
  } do
    assert Placement.place_root(user, root) == :skipped
  end

  describe "with a choice to make" do
    setup %{user: user, trace: trace, thread: thread, root: root} do
      {:ok, side} = Traces.create_thread(trace, %{"name" => "Side", "rank" => 1})

      {:ok, backend} =
        Accounts.create_category(user, [], %{"name" => "Backend", "color_background" => "#000"})

      {:ok, _docs} =
        Accounts.create_category(user, [], %{"name" => "Docs", "color_background" => "#111"})

      {:ok, child, _} =
        Traces.create_activity(trace, thread, root, %{"name" => "Child"}, %{
          "phase" => "B",
          "timestamp_integer" => 1_723_465_600_001
        })

      FlambeNextWeb.Endpoint.subscribe("events:#{user.id}")
      %{side: side, backend: backend, child: child}
    end

    test "moves the subtree, sets categories, records the decision, and re-broadcasts", ctx do
      answer = fn _model, prompt ->
        assert prompt =~ ~s("name":"Root")
        assert prompt =~ ~s("name":"Side")
        assert prompt =~ ~s("name":"Backend")

        {:ok,
         Jason.encode!(%{
           thread_id: ctx.side.id,
           category_ids: [ctx.backend.id],
           rationale: "Side work"
         })}
      end

      assert {:ok, %{moved?: true, thread_id: side_id, category_ids: [backend_id]}} =
               Placement.place_root(ctx.user, ctx.root, llm: answer)

      assert side_id == ctx.side.id and backend_id == ctx.backend.id

      root = Traces.get_user_activity!(ctx.user, ctx.root.id)
      child = Traces.get_user_activity!(ctx.user, ctx.child.id)
      assert root.thread_id == ctx.side.id
      assert child.thread_id == ctx.side.id
      assert Enum.map(root.categories, & &1.name) == ["Backend"]

      {_trace, events} = Traces.get_user_trace_with_events!(ctx.user, ctx.trace.id)
      [decision] = Enum.filter(events, &(&1.phase == "reducer_decision"))
      assert decision.activity_id == ctx.root.id
      assert decision.message =~ "thread=Main->Side"
      assert decision.message =~ "categories=Backend"

      # The root's B event is re-sent with the new thread, then the decision.
      assert_receive %Phoenix.Socket.Broadcast{
        event: "timeline_event",
        payload: %{event: %{phase: "B", activity: %{thread: %{id: ^side_id}}}}
      }

      assert_receive %Phoenix.Socket.Broadcast{
        event: "timeline_event",
        payload: %{event: %{phase: "reducer_decision"}}
      }
    end

    test "keeps the thread when the model says so and tolerates empty categories", ctx do
      answer = fn _model, _prompt ->
        {:ok, Jason.encode!(%{thread_id: ctx.thread.id, category_ids: [], rationale: "fine"})}
      end

      assert {:ok, %{moved?: false, category_ids: []}} =
               Placement.place_root(ctx.user, ctx.root, llm: answer)

      assert Traces.get_user_activity!(ctx.user, ctx.root.id).thread_id == ctx.thread.id
    end

    test "rejects ids outside the offered lists and changes nothing", ctx do
      answer = fn _model, _prompt ->
        {:ok, Jason.encode!(%{thread_id: 999_999, category_ids: [], rationale: "nope"})}
      end

      assert {:error, :invalid_model_response} =
               Placement.place_root(ctx.user, ctx.root, llm: answer)

      assert Traces.get_user_activity!(ctx.user, ctx.root.id).thread_id == ctx.thread.id
      {_trace, events} = Traces.get_user_trace_with_events!(ctx.user, ctx.trace.id)
      assert Enum.all?(events, &(&1.phase != "reducer_decision"))
    end

    test "a failed model call changes nothing", ctx do
      assert {:error, :boom} =
               Placement.place_root(ctx.user, ctx.root, llm: fn _, _ -> {:error, :boom} end)
    end
  end
end
