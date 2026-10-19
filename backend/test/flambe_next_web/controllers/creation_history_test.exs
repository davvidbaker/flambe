defmodule FlambeNextWeb.CreationHistoryTest do
  use FlambeNextWeb.ConnCase, async: true
  alias FlambeNext.{Accounts, Repo, Traces}
  alias FlambeNext.Traces.{Activity, Event}

  setup %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Redo", username: "redo"})
    {:ok, trace} = Traces.create_trace(user, %{name: "History"})
    [thread] = Traces.get_trace!(trace.id).threads
    conn = conn |> init_test_session(%{}) |> put_session(:user_id, user.id)
    %{user: user, trace: trace, thread: thread, conn: conn}
  end

  defp reverse(conn, trace, attrs) do
    response = post(conn, ~p"/api/traces/#{trace.id}/reverse_creation", attrs)
    %{"data" => %{"undo_token" => token}} = json_response(response, 200)
    {recycle(response), token}
  end

  test "activity undo/redo retains IDs, timestamps, categories, events, and child links", s do
    {:ok, category} =
      Accounts.create_category(s.user, [], %{
        "name" => "Category",
        "color_background" => "#123456"
      })

    {:ok, activity, first} =
      Traces.create_activity(
        s.trace,
        s.thread,
        nil,
        %{"name" => "Exact record", "description" => "Keep this"},
        %{"phase" => "B", "timestamp_integer" => 1234},
        [category]
      )

    {:ok, child} =
      Traces.create_unstarted_activity(s.trace, s.thread, activity, %{"name" => "Child"})

    original = Repo.get!(Activity, activity.id)
    original_event = Repo.get!(Event, first.id)

    {conn, redo} = reverse(s.conn, s.trace, %{"kind" => "activity", "target_id" => activity.id})
    assert Repo.get(Activity, activity.id) == nil
    assert Repo.get(Event, first.id) == nil
    assert Repo.get!(Activity, child.id).parent_id == nil

    {conn, undo} = reverse(conn, s.trace, %{"token" => redo})
    assert Repo.get!(Activity, activity.id) == original
    assert Repo.get!(Event, first.id) == original_event
    assert Repo.get!(Activity, child.id).parent_id == activity.id

    assert Enum.map(
             Repo.preload(Repo.get!(Activity, activity.id), :categories).categories,
             & &1.id
           ) == [category.id]

    {_conn, _redo_again} = reverse(conn, s.trace, %{"token" => undo})
    assert Repo.get(Activity, activity.id) == nil
  end

  test "lifecycle redo restores the original event and weighted suspension together", s do
    {:ok, activity, _} =
      Traces.create_activity(s.trace, s.thread, nil, %{"name" => "Weighted", "weight" => 9}, %{
        "phase" => "B",
        "timestamp_integer" => 1
      })

    {:ok, event} =
      Traces.create_event(s.trace, activity, %{"phase" => "S", "timestamp_integer" => 2000})

    original = Repo.get!(Event, event.id)

    {conn, redo} =
      reverse(s.conn, s.trace, %{
        "kind" => "event",
        "target_id" => event.id,
        "restore_weight" => %{"activity_id" => activity.id, "weight" => nil}
      })

    assert Repo.get!(Activity, activity.id).weight == nil
    assert Repo.get(Event, event.id) == nil
    {conn, undo} = reverse(conn, s.trace, %{"token" => redo})
    assert Repo.get!(Activity, activity.id).weight == 9
    assert Repo.get!(Event, event.id) == original
    {_conn, _} = reverse(conn, s.trace, %{"token" => undo})
    assert Repo.get!(Activity, activity.id).weight == nil
    assert Repo.get(Event, event.id) == nil
  end

  test "redo of an unstarted plan retains schedule and proposer", s do
    {:ok, plan} =
      Traces.create_unstarted_activity(s.trace, s.thread, nil, %{
        "name" => "Plan",
        "scheduled_start_integer" => 5000,
        "proposed_by_agent_name" => "Agent"
      })

    original = Repo.get!(Activity, plan.id)
    {conn, redo} = reverse(s.conn, s.trace, %{"kind" => "activity", "target_id" => plan.id})
    {_conn, _undo} = reverse(conn, s.trace, %{"token" => redo})
    assert Repo.get!(Activity, plan.id) == original
  end

  test "tampering and cross-trace restoration are rejected", s do
    {:ok, plan} = Traces.create_unstarted_activity(s.trace, s.thread, nil, %{"name" => "Plan"})
    {conn, token} = reverse(s.conn, s.trace, %{"kind" => "activity", "target_id" => plan.id})

    response =
      post(conn, ~p"/api/traces/#{s.trace.id}/reverse_creation", %{"token" => token <> "invalid"})

    assert response.status == 422
    {:ok, other} = Traces.create_trace(s.user, %{name: "Other"})

    response =
      post(recycle(response), ~p"/api/traces/#{other.id}/reverse_creation", %{"token" => token})

    assert response.status == 422
    assert Repo.get(Activity, plan.id) == nil
  end

  test "subsequent child changes reject restoration without partial inserts", s do
    {:ok, parent} =
      Traces.create_unstarted_activity(s.trace, s.thread, nil, %{"name" => "Parent"})

    {:ok, child} =
      Traces.create_unstarted_activity(s.trace, s.thread, parent, %{"name" => "Child"})

    {conn, token} = reverse(s.conn, s.trace, %{"kind" => "activity", "target_id" => parent.id})
    {:ok, other} = Traces.create_thread(s.trace, %{name: "Other", rank: 1})
    {:ok, _} = Traces.move_activity_subtree(s.user, Repo.get!(Activity, child.id), other.id, [])
    response = post(conn, ~p"/api/traces/#{s.trace.id}/reverse_creation", %{"token" => token})
    assert response.status == 409
    assert Repo.get(Activity, parent.id) == nil
  end
end
