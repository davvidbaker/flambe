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

  test "lifecycle results carry direction, reply, and rules_fired without a model" do
    previous = System.get_env("OPENAI_API_KEY")
    System.delete_env("OPENAI_API_KEY")

    on_exit(fn ->
      if previous,
        do: System.put_env("OPENAI_API_KEY", previous),
        else: System.delete_env("OPENAI_API_KEY")
    end)

    {:ok, user} =
      Accounts.create_user(%{
        name: "Quiet",
        username: "quiet-#{System.unique_integer([:positive])}"
      })

    {:ok, trace} = Traces.create_trace(user, %{name: "Quiet trace"})
    trace = Traces.get_trace!(trace.id)
    [thread] = trace.threads

    assert {:ok, started} =
             AgentCommands.execute(user, "start", %{
               "trace_id" => trace.id,
               "thread_id" => thread.id,
               "name" => "Logged without a model",
               "agent_id" => "quiet-agent",
               "timestamp" => 3_000
             })

    assert started.direction == nil
    assert started.reply == nil
    assert started.rules_fired == []

    assert {:ok, ended} =
             AgentCommands.execute(user, "end", %{
               "trace_id" => trace.id,
               "activity_id" => started.activity_id,
               "timestamp" => 4_000
             })

    assert ended.direction == nil
    assert ended.reply == nil
    assert ended.rules_fired == []
    assert ended.event_id
  end

  test "message returns the injected model's assessment without calling the network" do
    decision =
      Jason.encode!(%{
        "assessment" => "on_track",
        "direction" => nil,
        "reply" => nil,
        "rationale" => "Routine.",
        "actions" => [%{"type" => "no_op"}]
      })

    Application.put_env(:flambe_next, :reducer_llm, fn _model, _prompt -> {:ok, decision} end)

    on_exit(fn -> Application.delete_env(:flambe_next, :reducer_llm) end)

    {:ok, user} =
      Accounts.create_user(%{
        name: "Injected",
        username: "injected-#{System.unique_integer([:positive])}"
      })

    {:ok, trace} = Traces.create_trace(user, %{name: "Injected trace"})
    trace = Traces.get_trace!(trace.id)
    [thread] = trace.threads

    {:ok, started} =
      AgentCommands.execute(user, "start", %{
        "trace_id" => trace.id,
        "thread_id" => thread.id,
        "name" => "Ask the reducer",
        "agent_id" => "injected-agent",
        "timestamp" => 5_000
      })

    assert {:ok, result} =
             AgentCommands.execute(user, "message", %{
               "trace_id" => trace.id,
               "activity_id" => started.activity_id,
               "agent_id" => "injected-agent",
               "message" => "Still on the root."
             })

    assert result.assessment == "on_track"
    assert result.direction == nil
    assert result.reply == nil
    assert result.actions_applied == [%{type: "no_op"}]
    assert result.rules_fired == []
  end

  test "deterministic structure rules rewrite a duplicate start, resume a suspended ancestor, and name the parent on end" do
    {:ok, user} =
      Accounts.create_user(%{
        name: "Rules",
        username: "rules-#{System.unique_integer([:positive])}"
      })

    {:ok, trace} = Traces.create_trace(user, %{name: "Rules trace"})
    trace = Traces.get_trace!(trace.id)
    [thread] = trace.threads

    {:ok, first} =
      AgentCommands.execute(user, "start", %{
        "trace_id" => trace.id,
        "thread_id" => thread.id,
        "name" => "Same work",
        "agent_id" => "rules-agent",
        "timestamp" => 10_000
      })

    assert {:ok, duplicate} =
             AgentCommands.execute(user, "start", %{
               "trace_id" => trace.id,
               "thread_id" => thread.id,
               "name" => "Same work",
               "agent_id" => "rules-agent",
               "parent_id" => nil,
               "timestamp" => 11_000
             })

    assert duplicate.activity_id == first.activity_id
    assert duplicate.actions_applied == [%{type: "no_op", activity_id: first.activity_id}]
    assert [%{rule: "duplicate_open"}] = duplicate.rules_fired

    {:ok, parent} =
      AgentCommands.execute(user, "start", %{
        "trace_id" => trace.id,
        "name" => "Paused parent",
        "agent_id" => "rules-agent",
        "parent_id" => nil,
        "timestamp" => 12_000
      })

    assert {:ok, _} =
             AgentCommands.execute(user, "suspend", %{
               "trace_id" => trace.id,
               "activity_id" => parent.activity_id,
               "timestamp" => 13_000
             })

    assert {:ok, child} =
             AgentCommands.execute(user, "start", %{
               "trace_id" => trace.id,
               "name" => "Child under paused work",
               "agent_id" => "rules-agent",
               "parent_id" => parent.activity_id,
               "timestamp" => 14_000
             })

    assert [%{rule: "resume_ancestor", applied: [parent_id]}] = child.rules_fired
    assert parent_id == parent.activity_id
    assert child.actions_applied == [%{type: "resume_ancestor", activity_id: parent.activity_id}]

    assert {:ok, ended} =
             AgentCommands.execute(user, "end", %{
               "trace_id" => trace.id,
               "activity_id" => child.activity_id,
               "timestamp" => 15_000
             })

    assert [%{rule: "pop_to_parent", applied: %{activity_id: popped_id, name: "Paused parent"}}] =
             ended.rules_fired

    assert popped_id == parent.activity_id
  end

  test "a new root while a leaf is open is judged, and a model failure keeps the recorded root" do
    {:ok, user} =
      Accounts.create_user(%{
        name: "Judge",
        username: "judge-#{System.unique_integer([:positive])}"
      })

    {:ok, trace} = Traces.create_trace(user, %{name: "Judge trace"})
    trace = Traces.get_trace!(trace.id)
    [thread] = trace.threads

    {:ok, leaf} =
      AgentCommands.execute(user, "start", %{
        "trace_id" => trace.id,
        "thread_id" => thread.id,
        "name" => "Open leaf",
        "agent_id" => "judge-agent",
        "timestamp" => 20_000
      })

    Application.put_env(:flambe_next, :reducer_llm, fn _model, _prompt -> {:error, :timeout} end)
    on_exit(fn -> Application.delete_env(:flambe_next, :reducer_llm) end)

    assert {:ok, root} =
             AgentCommands.execute(user, "start", %{
               "trace_id" => trace.id,
               "thread_id" => thread.id,
               "name" => "Another stream",
               "agent_id" => "judge-agent",
               "parent_id" => nil,
               "timestamp" => 21_000
             })

    assert root.direction == nil
    assert [%{rule: "new_root_while_open", applied: %{type: "skipped"}}] = root.rules_fired
    activity = Traces.get_user_activity!(user, root.activity_id)
    assert activity.parent_id == nil
    assert activity.id != leaf.activity_id
  end

  test "the model may keep, reparent, rename, or ask, and an invalid response changes nothing" do
    {:ok, user} =
      Accounts.create_user(%{
        name: "Outcomes",
        username: "outcomes-#{System.unique_integer([:positive])}"
      })

    {:ok, trace} = Traces.create_trace(user, %{name: "Outcomes trace"})
    trace = Traces.get_trace!(trace.id)
    [thread] = trace.threads

    start_root = fn name, timestamp ->
      AgentCommands.execute(user, "start", %{
        "trace_id" => trace.id,
        "thread_id" => thread.id,
        "name" => name,
        "agent_id" => "outcomes-agent",
        "parent_id" => nil,
        "timestamp" => timestamp
      })
    end

    {:ok, leaf} = start_root.("Billing export", 30_000)

    Application.put_env(:flambe_next, :reducer_llm, fn _model, _prompt ->
      {:ok,
       ~s({"assessment":"on_track","direction":"continue","reply":null,"action":{"type":"keep"}})}
    end)

    on_exit(fn -> Application.delete_env(:flambe_next, :reducer_llm) end)

    assert {:ok, kept} = start_root.("Unrelated ledger", 31_000)
    assert kept.direction == "continue"
    assert Traces.get_user_activity!(user, kept.activity_id).parent_id == nil

    assert {:ok, _} =
             AgentCommands.execute(user, "end", %{
               "trace_id" => trace.id,
               "activity_id" => kept.activity_id,
               "timestamp" => 31_500
             })

    Application.put_env(:flambe_next, :reducer_llm, fn _model, prompt ->
      if String.contains?(prompt, "new_root_while_open") do
        {:ok,
         Jason.encode!(%{
           "assessment" => "slightly_off_track",
           "direction" => "narrow_scope",
           "reply" => "This belongs under the open leaf.",
           "action" => %{"type" => "reparent", "parent_activity_id" => leaf.activity_id}
         })}
      else
        {:ok,
         ~s({"assessment":"uncertain","direction":null,"reply":null,"action":{"type":"ask","question":"What is this about?"}})}
      end
    end)

    assert {:ok, nested} = start_root.("Export rows", 32_000)
    assert Traces.get_user_activity!(user, nested.activity_id).parent_id == leaf.activity_id
    assert nested.direction == "narrow_scope"
    assert [%{type: "reparent"}] = Enum.filter(nested.actions_applied, &(&1.type == "reparent"))

    assert {:ok, asked} =
             AgentCommands.execute(user, "start", %{
               "trace_id" => trace.id,
               "thread_id" => thread.id,
               "name" => "Calendar sync",
               "agent_id" => "outcomes-agent",
               "parent_id" => leaf.activity_id,
               "timestamp" => 33_000
             })

    assert asked.reply == "What is this about?"
    assert [%{type: "ask"}] = Enum.filter(asked.actions_applied, &(&1.type == "ask"))
    assert Traces.get_user_activity!(user, asked.activity_id).name == "Calendar sync"

    Application.put_env(:flambe_next, :reducer_llm, fn _model, _prompt ->
      {:ok,
       Jason.encode!(%{
         "assessment" => "uncertain",
         "direction" => nil,
         "reply" => nil,
         "action" => %{"type" => "rename", "name" => "Export the billing rows"}
       })}
    end)

    assert {:ok, renamed} =
             AgentCommands.execute(user, "start", %{
               "trace_id" => trace.id,
               "name" => "Spreadsheet dance",
               "agent_id" => "outcomes-agent",
               "parent_id" => leaf.activity_id,
               "timestamp" => 34_000
             })

    assert Traces.get_user_activity!(user, renamed.activity_id).name == "Export the billing rows"

    Application.put_env(:flambe_next, :reducer_llm, fn _model, _prompt -> {:ok, "nope"} end)

    assert {:ok, invalid} =
             AgentCommands.execute(user, "start", %{
               "trace_id" => trace.id,
               "name" => "Kitchen remodel",
               "agent_id" => "outcomes-agent",
               "parent_id" => leaf.activity_id,
               "timestamp" => 35_000
             })

    assert invalid.direction == nil
    assert Traces.get_user_activity!(user, invalid.activity_id).name == "Kitchen remodel"
    assert Traces.get_user_activity!(user, invalid.activity_id).parent_id == leaf.activity_id
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
