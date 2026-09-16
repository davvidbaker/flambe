defmodule FlambeNext.AgentCommandsTest do
  use FlambeNext.DataCase, async: false

  alias FlambeNext.{Accounts, AgentCommands, Repo, Traces}
  alias FlambeNext.Traces.Activity
  alias FlambeNextWeb.Endpoint

  setup do
    suffix = System.unique_integer([:positive])
    {:ok, user} = Accounts.create_user(%{name: "Agent User", username: "agent-user-#{suffix}"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Agent trace"})
    thread = trace.id |> Traces.get_trace!() |> Map.fetch!(:threads) |> List.first()
    %{user: user, trace: trace, thread: thread}
  end

  test "start infers only the calling agent's newest active parent", context do
    %{user: user, trace: trace, thread: thread} = context

    {:ok, other} =
      AgentCommands.execute(user, "start", %{
        "trace_id" => trace.id,
        "thread_id" => thread.id,
        "name" => "Other agent",
        "agent_id" => "other",
        "timestamp" => 1000
      })

    {:ok, mine} =
      AgentCommands.execute(user, "start", %{
        "trace_id" => trace.id,
        "thread_id" => thread.id,
        "name" => "Mine",
        "agent_id" => "mine",
        "timestamp" => 2000
      })

    {:ok, child} =
      AgentCommands.execute(user, "start", %{
        "trace_id" => trace.id,
        "thread_id" => thread.id,
        "name" => "My child",
        "agent_id" => "mine",
        "timestamp" => 3000
      })

    assert Repo.get!(Activity, child.activity_id).parent_id == mine.activity_id
    refute Repo.get!(Activity, child.activity_id).parent_id == other.activity_id
  end

  test "explicit null starts a root while omitted parent infers", context do
    %{user: user, trace: trace, thread: thread} = context
    {:ok, parent} = start(user, trace, thread, "Parent", 1000)

    {:ok, inferred} = start(user, trace, thread, "Inferred", 2000)

    {:ok, root} =
      AgentCommands.execute(user, "start", %{
        "trace_id" => trace.id,
        "thread_id" => thread.id,
        "parent_id" => nil,
        "name" => "Root",
        "agent_id" => "agent",
        "timestamp" => 3000
      })

    assert Repo.get!(Activity, inferred.activity_id).parent_id == parent.activity_id
    assert Repo.get!(Activity, root.activity_id).parent_id == nil
  end

  test "ended work is excluded from inference even when it has reducer bookkeeping later",
       context do
    %{user: user, trace: trace, thread: thread} = context
    {:ok, ended} = start(user, trace, thread, "Ended", 1000)

    assert {:ok, _} =
             AgentCommands.execute(user, "end", %{
               "trace_id" => trace.id,
               "activity_id" => ended.activity_id,
               "timestamp" => 2000
             })

    activity = Traces.get_user_trace_activity!(user, trace.id, ended.activity_id)

    {:ok, _} =
      Traces.create_event(trace, activity, %{
        "phase" => "reducer_decision",
        "timestamp_integer" => 4000
      })

    {:ok, active} = start(user, trace, thread, "Active", 3000)
    {:ok, child} = start(user, trace, thread, "Child", 5000)
    assert Repo.get!(Activity, child.activity_id).parent_id == active.activity_id
  end

  test "status filters by authorized thread and exposes actionable state", context do
    %{user: user, trace: trace, thread: thread} = context
    {:ok, other_thread} = Traces.create_thread(trace, %{name: "Other", rank: 1})
    {:ok, parent} = start(user, trace, thread, "Parent", 1000)
    {:ok, child} = start(user, trace, thread, "Child", 2000)

    {:ok, _other} =
      AgentCommands.execute(user, "start", %{
        "trace_id" => trace.id,
        "thread_id" => other_thread.id,
        "parent_id" => nil,
        "name" => "Elsewhere",
        "agent_id" => "other-agent",
        "timestamp" => 3000
      })

    assert {:ok, result} =
             AgentCommands.execute(user, "status", %{
               "trace_id" => trace.id,
               "thread_id" => thread.id
             })

    assert [%{id: id, availableActions: [%{operation: "start", arguments: root_args}]}] =
             result.state.threads

    assert id == thread.id
    assert root_args == %{trace_id: trace.id, thread_id: thread.id, parent_id: nil}
    assert Enum.map(result.state.activities, & &1.id) == [parent.activity_id, child.activity_id]

    parent_view = Enum.find(result.state.activities, &(&1.id == parent.activity_id))
    end_action = Enum.find(parent_view.availableActions, &(&1.operation == "end"))
    assert end_action.reason == "open_descendants"
    assert end_action.requires == %{force: true}
  end

  test "suspended parent suppresses child suggestions and resume remains available", context do
    %{user: user, trace: trace, thread: thread} = context
    {:ok, parent} = start(user, trace, thread, "Parent", 1000)
    {:ok, child} = start(user, trace, thread, "Child", 2000)

    assert {:ok, _} =
             AgentCommands.execute(user, "suspend", %{
               "trace_id" => trace.id,
               "activity_id" => parent.activity_id,
               "timestamp" => 3000
             })

    {:ok, status} = AgentCommands.execute(user, "status", %{"trace_id" => trace.id})
    parent_view = Enum.find(status.state.activities, &(&1.id == parent.activity_id))
    child_view = Enum.find(status.state.activities, &(&1.id == child.activity_id))

    assert parent_view.status == "suspended"
    assert Enum.any?(parent_view.availableActions, &(&1.operation == "resume"))
    assert child_view.status == "parent_suspended"
    assert child_view.availableActions == []

    {:ok, next} = start(user, trace, thread, "Separate work", 4000)
    assert Repo.get!(Activity, next.activity_id).parent_id == nil
  end

  test "end reports open descendants unless forced and broadcasts every write", context do
    %{user: user, trace: trace, thread: thread} = context
    {:ok, parent} = start(user, trace, thread, "Parent", 1000)
    {:ok, child} = start(user, trace, thread, "Child", 2000)
    child_record = Traces.get_user_trace_activity!(user, trace.id, child.activity_id)

    {:ok, _} =
      Traces.create_event(trace, child_record, %{
        "phase" => "X",
        "timestamp_integer" => 2500
      })

    {:ok, _} =
      Traces.create_event(trace, child_record, %{
        "phase" => "reducer_decision",
        "timestamp_integer" => 2600
      })

    :ok = Endpoint.subscribe("events:#{user.id}")

    assert {:error, {:open_children, [%{activity_id: child_id}]}} =
             AgentCommands.execute(user, "end", %{
               "trace_id" => trace.id,
               "activity_id" => parent.activity_id,
               "timestamp" => 3000
             })

    assert child_id == child.activity_id

    assert {:ok, result} =
             AgentCommands.execute(user, "end", %{
               "trace_id" => trace.id,
               "activity_id" => parent.activity_id,
               "timestamp" => 3000,
               "force" => true
             })

    assert [%{activity_id: closed_id}] = result.closed_descendants
    assert closed_id == child.activity_id
    assert_receive %Phoenix.Socket.Broadcast{event: "timeline_event"}
    assert_receive %Phoenix.Socket.Broadcast{event: "timeline_event"}
  end

  test "all referenced ids are tenant scoped and message needs reducer configuration", context do
    %{user: owner, trace: trace, thread: thread} = context
    {:ok, activity} = start(owner, trace, thread, "Private", 1000)
    suffix = System.unique_integer([:positive])
    {:ok, intruder} = Accounts.create_user(%{name: "Intruder", username: "intruder-#{suffix}"})
    {:ok, foreign_trace} = Traces.create_trace(intruder, %{name: "Foreign trace"})

    foreign_thread =
      foreign_trace.id |> Traces.get_trace!() |> Map.fetch!(:threads) |> List.first()

    {:ok, foreign_activity} = start(intruder, foreign_trace, foreign_thread, "Foreign", 1000)

    {:ok, foreign_category} =
      Accounts.create_category(intruder, [], %{
        name: "Foreign",
        color_background: "#000000"
      })

    assert {:error, :not_found} =
             AgentCommands.execute(intruder, "status", %{"trace_id" => trace.id})

    assert {:error, :not_found} =
             AgentCommands.execute(owner, "status", %{
               "trace_id" => trace.id,
               "thread_id" => foreign_thread.id
             })

    for attrs <- [
          %{"thread_id" => foreign_thread.id},
          %{"thread_id" => thread.id, "parent_id" => foreign_activity.activity_id},
          %{"thread_id" => thread.id, "category_ids" => [foreign_category.id]}
        ] do
      assert {:error, :not_found} =
               AgentCommands.execute(
                 owner,
                 "start",
                 Map.merge(
                   %{"trace_id" => trace.id, "name" => "No access", "timestamp" => 2000},
                   attrs
                 )
               )
    end

    assert {:error, :not_found} =
             AgentCommands.execute(owner, "suspend", %{
               "trace_id" => trace.id,
               "activity_id" => foreign_activity.activity_id,
               "timestamp" => 2000
             })

    previous = System.get_env("OPENAI_API_KEY")
    System.delete_env("OPENAI_API_KEY")

    on_exit(fn ->
      if previous,
        do: System.put_env("OPENAI_API_KEY", previous),
        else: System.delete_env("OPENAI_API_KEY")
    end)

    assert {:error, :reducer_not_configured} =
             AgentCommands.execute(owner, "message", %{
               "trace_id" => trace.id,
               "activity_id" => activity.activity_id,
               "message" => "Update"
             })
  end

  defp start(user, trace, thread, name, timestamp) do
    AgentCommands.execute(user, "start", %{
      "trace_id" => trace.id,
      "thread_id" => thread.id,
      "name" => name,
      "agent_id" => "agent",
      "timestamp" => timestamp
    })
  end
end
