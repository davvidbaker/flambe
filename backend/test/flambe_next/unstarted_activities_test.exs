defmodule FlambeNext.UnstartedActivitiesTest do
  use FlambeNext.DataCase, async: false

  alias FlambeNext.{Accounts, AgentCommands, Repo, Traces}
  alias FlambeNext.Traces.{Activity, Event}

  setup do
    suffix = System.unique_integer([:positive])
    {:ok, user} = Accounts.create_user(%{name: "Plan User", username: "plan-user-#{suffix}"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Plan trace"})
    trace = Traces.get_trace!(trace.id)
    [thread | _] = trace.threads
    %{user: user, trace: trace, thread: thread}
  end

  test "plan creates an activity with no lifecycle event", %{user: user, trace: trace} do
    {:ok, result} =
      AgentCommands.execute(user, "plan", %{
        "trace_id" => trace.id,
        "name" => "Later",
        "agent_id" => "planner",
        "agent_name" => "Planner"
      })

    activity = Repo.get!(Activity, result.activity_id)
    assert activity.name == "Later"
    assert activity.agent_id == nil
    assert activity.proposed_by_agent_id == "planner"
    assert Traces.unstarted?(activity)

    {:ok, state} =
      AgentCommands.execute(user, "status", %{"trace_id" => trace.id, "agent_id" => "planner"})

    refute Enum.any?(state.state.activities, &(&1.id == activity.id))

    {:ok, with_unstarted} =
      AgentCommands.execute(user, "status", %{
        "trace_id" => trace.id,
        "agent_id" => "planner",
        "include_unstarted" => true
      })

    assert Enum.any?(with_unstarted.state.activities, &(&1.status == "unstarted"))
  end

  test "a start whose name matches limbo begins that activity", %{user: user, trace: trace} do
    {:ok, planned} =
      AgentCommands.execute(user, "plan", %{
        "trace_id" => trace.id,
        "name" => "Same name",
        "agent_id" => "planner",
        "agent_name" => "Planner"
      })

    {:ok, begun} =
      AgentCommands.execute(user, "start", %{
        "trace_id" => trace.id,
        "name" => "Same name",
        "agent_id" => "planner",
        "agent_name" => "Planner",
        "timestamp" => 5_000
      })

    assert begun.activity_id == planned.activity_id
    assert [%{type: "begin_existing"}] = begun.actions_applied

    activity = Repo.get!(Activity, planned.activity_id)
    assert activity.agent_id == "planner"
    assert activity.proposed_by_agent_id == "planner"
    assert Repo.get_by!(Event, activity_id: activity.id, phase: "B")
  end

  test "a scheduled name match does not begin the activity", %{user: user, trace: trace} do
    {:ok, planned} =
      AgentCommands.execute(user, "plan", %{
        "trace_id" => trace.id,
        "name" => "Scheduled",
        "agent_id" => "planner",
        "scheduled_start" => 9_000,
        "scheduled_end" => 10_000
      })

    {:ok, started} =
      AgentCommands.execute(user, "start", %{
        "trace_id" => trace.id,
        "name" => "Scheduled",
        "agent_id" => "planner",
        "timestamp" => 5_000
      })

    refute started.activity_id == planned.activity_id
  end

  test "begin is refused while the parent is unstarted", %{trace: trace, thread: thread} do
    {:ok, parent} =
      Traces.create_unstarted_activity(trace, thread, nil, %{"name" => "Parent"}, [])

    {:ok, child} =
      Traces.create_unstarted_activity(trace, thread, parent, %{"name" => "Child"}, [])

    assert {:error, :parent_unstarted} =
             Traces.begin_unstarted_activity(trace, child, %{
               "phase" => "B",
               "timestamp_integer" => 1_000
             })
  end

  test "an edit that puts the end before the start keeps the old times", %{
    trace: trace,
    thread: thread
  } do
    {:ok, activity} =
      Traces.create_unstarted_activity(
        trace,
        thread,
        nil,
        %{
          "name" => "Window",
          "scheduled_start_integer" => 1_000,
          "scheduled_end_integer" => 2_000
        },
        []
      )

    assert {:error, changeset} =
             Traces.update_activity(
               activity,
               %{"scheduled_end_integer" => 500},
               []
             )

    assert "must be at or after scheduled_start" in errors_on(changeset).scheduled_end
    reloaded = Repo.get!(Activity, activity.id)
    assert DateTime.to_unix(reloaded.scheduled_start, :millisecond) == 1_000
    assert DateTime.to_unix(reloaded.scheduled_end, :millisecond) == 2_000
  end

  test "deleting an unstarted activity reparents its children", %{
    trace: trace,
    thread: thread
  } do
    {:ok, parent} =
      Traces.create_unstarted_activity(trace, thread, nil, %{"name" => "Parent"}, [])

    {:ok, child} =
      Traces.create_unstarted_activity(trace, thread, parent, %{"name" => "Child"}, [])

    assert {:ok, _} = Traces.delete_unstarted_activity(parent)
    assert Repo.get(Activity, parent.id) == nil
    assert Repo.get!(Activity, child.id).parent_id == nil
  end

  test "a past scheduled time does not begin the activity", %{user: user, trace: trace} do
    {:ok, result} =
      AgentCommands.execute(user, "plan", %{
        "trace_id" => trace.id,
        "name" => "Already due",
        "agent_id" => "planner",
        "scheduled_start" => 1
      })

    activity = Repo.get!(Activity, result.activity_id)
    assert Traces.unstarted?(activity)
    assert activity.agent_id == nil
  end
end
