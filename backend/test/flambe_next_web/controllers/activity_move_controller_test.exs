defmodule FlambeNextWeb.ActivityMoveControllerTest do
  use FlambeNextWeb.ConnCase, async: true
  alias FlambeNext.{Accounts, Traces}

  setup %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Undo", username: "move-undo"})
    {:ok, trace} = Traces.create_trace(user, %{name: "History"})
    [source] = Traces.get_trace!(trace.id).threads
    {:ok, destination} = Traces.create_thread(trace, %{name: "Destination", rank: 1})

    {:ok, parent} =
      Traces.create_unstarted_activity(trace, source, nil, %{"name" => "Parent"}, [])

    {:ok, child} =
      Traces.create_unstarted_activity(trace, source, parent, %{"name" => "Child"}, [])

    {:ok, untouched} =
      Traces.create_unstarted_activity(trace, source, parent, %{"name" => "Untouched"}, [])

    conn = conn |> init_test_session(%{}) |> put_session(:user_id, user.id)

    %{
      conn: conn,
      user: user,
      trace: trace,
      source: source,
      destination: destination,
      parent: parent,
      child: child,
      untouched: untouched
    }
  end

  test "bulk move preserves selected links, excludes children, and undo restores all relationships",
       s do
    response =
      post(s.conn, ~p"/api/traces/#{s.trace.id}/activity_moves", %{
        "activity_ids" => [s.parent.id, s.child.id],
        "thread_id" => s.destination.id
      })

    %{"data" => %{"undo_token" => token}} = json_response(response, 200)
    assert Traces.get_user_activity!(s.user, s.parent.id).thread_id == s.destination.id
    assert Traces.get_user_activity!(s.user, s.child.id).parent_id == s.parent.id
    assert Traces.get_user_activity!(s.user, s.untouched.id).thread_id == s.source.id
    assert Traces.get_user_activity!(s.user, s.untouched.id).parent_id == nil

    response =
      post(recycle(response), ~p"/api/traces/#{s.trace.id}/undo_move", %{"undo_token" => token})

    assert response.status == 200

    for id <- [s.parent.id, s.child.id, s.untouched.id] do
      assert Traces.get_user_activity!(s.user, id).thread_id == s.source.id
    end

    assert Traces.get_user_activity!(s.user, s.child.id).parent_id == s.parent.id
    assert Traces.get_user_activity!(s.user, s.untouched.id).parent_id == s.parent.id

    %{"data" => %{"undo_token" => redo_token}} = json_response(response, 200)

    response =
      post(recycle(response), ~p"/api/traces/#{s.trace.id}/undo_move", %{
        "undo_token" => redo_token
      })

    %{"data" => %{"undo_token" => undo_again}} = json_response(response, 200)
    assert Traces.get_user_activity!(s.user, s.parent.id).thread_id == s.destination.id
    assert Traces.get_user_activity!(s.user, s.child.id).parent_id == s.parent.id
    assert Traces.get_user_activity!(s.user, s.untouched.id).parent_id == nil

    response =
      post(recycle(response), ~p"/api/traces/#{s.trace.id}/undo_move", %{
        "undo_token" => undo_again
      })

    assert response.status == 200
    assert Traces.get_user_activity!(s.user, s.untouched.id).parent_id == s.parent.id
  end

  test "invalid selection rolls back the complete move", s do
    response =
      post(s.conn, ~p"/api/traces/#{s.trace.id}/activity_moves", %{
        "activity_ids" => [s.parent.id, -1],
        "thread_id" => s.destination.id
      })

    assert response.status == 422
    assert Traces.get_user_activity!(s.user, s.parent.id).thread_id == s.source.id
    assert Traces.get_user_activity!(s.user, s.child.id).parent_id == s.parent.id
  end

  test "rejects changed relationships without partially restoring", s do
    {:ok, token} =
      FlambeNext.Traces.ActivityMoves.move(s.user, s.trace.id, [s.parent.id], s.destination.id)

    parent = Traces.get_user_activity!(s.user, s.parent.id)
    {:ok, _} = Traces.move_activity_subtree(s.user, parent, s.source.id, [])
    response = post(s.conn, ~p"/api/traces/#{s.trace.id}/undo_move", %{"undo_token" => token})
    assert response.status == 409
    assert Traces.get_user_activity!(s.user, s.child.id).parent_id == nil
  end

  test "rejects forged records and records from another trace", s do
    {:ok, token} =
      FlambeNext.Traces.ActivityMoves.move(s.user, s.trace.id, [s.parent.id], s.destination.id)

    response =
      post(s.conn, ~p"/api/traces/#{s.trace.id}/undo_move", %{"undo_token" => token <> "tampered"})

    assert response.status == 422
    {:ok, other} = Traces.create_trace(s.user, %{name: "Other"})

    response =
      post(recycle(response), ~p"/api/traces/#{other.id}/undo_move", %{"undo_token" => token})

    assert response.status == 422
    assert Traces.get_user_activity!(s.user, s.parent.id).thread_id == s.destination.id
  end
end
