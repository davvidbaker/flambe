defmodule FlambeNext.Reducer.JevIntegrationTest do
  use FlambeNext.DataCase, async: true

  alias FlambeNext.{Accounts, Traces}
  alias FlambeNext.Reducer.{Placement, Review}

  setup do
    suffix = System.unique_integer([:positive])
    {:ok, user} = Accounts.create_user(%{name: "Jev", username: "jev-#{suffix}"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Jev trace"})
    trace = Traces.get_trace!(trace.id)
    [thread] = trace.threads

    {:ok, root, _event} =
      Traces.create_activity(trace, thread, nil, %{"name" => "Implement reducer"}, %{
        "phase" => "B",
        "timestamp_integer" => 1_723_465_600_000
      })

    %{user: user, trace: trace, thread: thread, root: root}
  end

  test "routine messages are decided by Jev without calling the generative reducer", ctx do
    jev = fn state, questions ->
      assert state.message == "Still implementing the reducer."
      assert questions["route"].type == "choice"

      {:ok,
       %{
         "model" => "jev-test",
         "answers" => %{"route" => %{"type" => "choice", "choice" => "routine"}}
       }}
    end

    llm = fn _, _ -> flunk("routine Jev decisions should not call the generative reducer") end

    assert {:ok, review} =
             Review.handle(
               ctx.user,
               %{
                 "trace_id" => ctx.trace.id,
                 "activity_id" => ctx.root.id,
                 "message" => "Still implementing the reducer.",
                 "agent_id" => "worker"
               },
               jev: jev,
               llm: llm
             )

    assert review.assessment == "on_track"
    assert review.direction == nil
    assert review.reducer_model == "jev-test"
    assert review.actions_applied == [%{type: "no_op"}]
  end

  test "Jev routes non-routine messages to the existing generative review", ctx do
    jev = fn _state, _questions ->
      {:ok,
       %{
         "model" => "jev-test",
         "answers" => %{"route" => %{"type" => "choice", "choice" => "review"}}
       }}
    end

    llm = fn _model, _prompt ->
      {:ok,
       Jason.encode!(%{
         "assessment" => "on_track",
         "direction" => "continue",
         "reply" => "Keep going.",
         "rationale" => "The work still matches the current root.",
         "actions" => [%{"type" => "no_op"}]
       })}
    end

    assert {:ok, review} =
             Review.handle(
               ctx.user,
               %{
                 "trace_id" => ctx.trace.id,
                 "activity_id" => ctx.root.id,
                 "message" => "I found an ambiguity and need a judgment.",
                 "agent_id" => "worker"
               },
               jev: jev,
               llm: llm
             )

    assert review.direction == "continue"
    assert review.reply == "Keep going."
    assert review.actions_applied == [%{type: "no_op"}]
  end

  test "Jev directly resolves new-root structure choices", ctx do
    {:ok, new_root, _event} =
      Traces.create_activity(ctx.trace, ctx.thread, nil, %{"name" => "Push the changes"}, %{
        "phase" => "B",
        "timestamp_integer" => 1_723_465_600_001
      })

    rule = %{
      name: "new_root_while_open",
      open_leaf: %{id: ctx.root.id, name: ctx.root.name},
      previous_root: %{id: ctx.root.id, name: ctx.root.name},
      ancestors: [],
      candidate_ids: [ctx.root.id]
    }

    jev = fn _state, questions ->
      assert questions["action"].type == "choice"

      {:ok,
       %{
         "model" => "jev-test",
         "answers" => %{
           "action" => %{"type" => "choice", "choice" => "reparent_#{ctx.root.id}"}
         }
       }}
    end

    assert {:ok, judgment} = Review.judge_structure(ctx.user, new_root, rule, jev: jev)
    assert judgment.action.parent_activity_id == ctx.root.id
    assert judgment.direction == "continue"
  end

  test "Jev places roots with a typed thread choice and parallel category judgments", ctx do
    {:ok, side} = Traces.create_thread(ctx.trace, %{"name" => "Reducer work", "rank" => 1})

    {:ok, backend} =
      Accounts.create_category(ctx.user, [], %{
        "name" => "Backend",
        "color_background" => "#000"
      })

    jev = fn state, questions ->
      assert state.activity.name == "Implement reducer"
      assert questions["thread"].type == "choice"
      assert questions["category_#{backend.id}"].type == "noul"

      {:ok,
       %{
         "model" => "jev-test",
         "answers" => %{
           "thread" => %{"type" => "choice", "choice" => "thread_#{side.id}"},
           "category_#{backend.id}" => %{"type" => "noul", "noul" => 0.91}
         }
       }}
    end

    assert {:ok, %{moved?: true, thread_id: thread_id, category_ids: category_ids}} =
             Placement.place_root(ctx.user, ctx.root, jev: jev)

    assert thread_id == side.id
    assert category_ids == [backend.id]
  end
end
