defmodule FlambeNext.ReconciliationTest do
  use FlambeNext.DataCase, async: false

  alias FlambeNext.{Accounts, Traces}
  alias FlambeNext.Traces.Reconciliation

  test "atomically restores active work and records a replayable audit receipt" do
    {:ok, user} = Accounts.create_user(%{name: "Repair User", username: "repair-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Repair trace"})
    [thread] = Traces.get_trace!(trace.id).threads
    agent = %{id: "repair-agent", name: "Repair Agent"}
    {:ok, %{trace_version: version}} = Reconciliation.version(user, trace.id)

    proposal = %{
      "repair_id" => "repair-1",
      "trace_version" => version,
      "coverage_gaps" => ["Subagent record unavailable"],
      "changes" => [
        %{
          "ref" => "work",
          "name" => "Restore work",
          "thread_id" => thread.id,
          "reason" => "Activity start was absent",
          "events" => [
            %{
              "phase" => "B",
              "timestamp_ms" => 1000,
              "timing" => "observed",
              "basis" => "Tool timestamp"
            }
          ]
        }
      ]
    }

    assert {:ok, repair} = Reconciliation.apply(user, trace.id, agent, proposal)
    assert [%{activity_id: activity_id, before: nil}] = repair.applied
    assert [%{id: ^activity_id, status: "running"}] = repair.active_stack
    assert {:ok, %{"replayed" => true}} = Reconciliation.apply(user, trace.id, agent, proposal)

    assert {:error, :trace_version_changed} =
             Reconciliation.apply(user, trace.id, agent, %{proposal | "repair_id" => "repair-2"})

    assert {_, [%{activity_id: ^activity_id}]} =
             Traces.get_user_trace_with_events!(user, trace.id)

    [event] = repair.applied |> hd() |> get_in([:after, :events])

    existing =
      proposal["changes"]
      |> hd()
      |> Map.put("activity_id", activity_id)
      |> put_in(["events", Access.at(0), "event_id"], event.id)

    child = %{
      "ref" => "delegated",
      "name" => "Subagent checks",
      "agent_id" => "repair-child",
      "session_ref" => "subagent-session",
      "thread_id" => thread.id,
      "parent_ref" => "work",
      "reason" => "Delegation and start observed in the harness",
      "events" => [
        %{
          "phase" => "B",
          "timestamp_ms" => 2000,
          "timing" => "estimated",
          "basis" => "First child tool call"
        }
      ]
    }

    assert {:ok, delegated} =
             Reconciliation.apply(user, trace.id, agent, %{
               "repair_id" => "delegation",
               "trace_version" => repair.trace_version,
               "changes" => [existing, child]
             })

    assert [_, %{after: %{activity: %{agent_id: "repair-child", parent_id: ^activity_id}}}] =
             delegated.applied

    assert length(delegated.active_stack) == 2
  end

  test "reviewed hierarchy respects trace bounds and preserves the proposed placement" do
    {:ok, user} = Accounts.create_user(%{name: "Review User", username: "review-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Reviewed trace"})
    [thread] = Traces.get_trace!(trace.id).threads
    agent = %{id: "review-agent", name: "Review Agent"}
    {:ok, %{trace_version: version}} = Reconciliation.version(user, trace.id)

    previous = Application.get_env(:flambe_next, :reducer_llm)

    on_exit(fn ->
      if previous,
        do: Application.put_env(:flambe_next, :reducer_llm, previous),
        else: Application.delete_env(:flambe_next, :reducer_llm)
    end)

    Application.put_env(:flambe_next, :reducer_llm, fn _model, prompt ->
      assert prompt =~ "too-early"

      {:ok,
       Jason.encode!(%{
         accepted_refs: ["parent", "child", "too-early"],
         placements: [
           %{ref: "child", parent_ref: "parent"},
           %{ref: "too-early", parent_ref: "parent"}
         ]
       })}
    end)

    change = fn ref, timestamp ->
      %{
        "ref" => ref,
        "name" => ref,
        "thread_id" => thread.id,
        "reason" => "Missing start",
        "events" => [
          %{
            "phase" => "B",
            "timestamp_ms" => timestamp,
            "timing" => "observed",
            "basis" => "Log timestamp"
          }
        ]
      }
    end

    assert {:ok, result} =
             Reconciliation.apply(user, trace.id, agent, %{
               "repair_id" => "review",
               "trace_version" => version,
               "changes" => [
                 change.("parent", 2000),
                 change.("child", 3000),
                 change.("too-early", 1000)
               ]
             })

    assert result.review == "reducer"

    assert [
             %{activity_id: parent_id},
             %{reviewed_parent_ref: "parent", after: %{activity: %{parent_id: parent_id}}}
           ] = result.applied

    assert [%{code: "ACTIVITY_PLACEMENT_UNVERIFIED"}] = result.conflicts
  end
end
