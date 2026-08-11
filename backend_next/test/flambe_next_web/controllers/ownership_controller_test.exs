defmodule FlambeNextWeb.OwnershipControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, Traces}

  test "a signed-in user cannot read another user's resource records", %{conn: conn} do
    {:ok, owner} = Accounts.create_user(%{name: "Owner", username: "resource-owner"})
    {:ok, intruder} = Accounts.create_user(%{name: "Intruder", username: "resource-intruder"})
    {:ok, trace} = Traces.create_trace(owner, %{name: "Private trace"})
    [thread] = Traces.get_user_trace!(owner, trace.id).threads

    {:ok, activity, event} =
      Traces.create_activity(
        trace,
        thread,
        %{name: "Private activity"},
        %{phase: "B", timestamp_integer: 1_700_000_000_000}
      )

    {:ok, category} =
      Accounts.create_category(owner, [], %{name: "Private category", color_background: "#ffffff"})

    {:ok, todo} = Accounts.create_todo(owner, %{name: "Private todo"})

    {:ok, mantra} =
      Accounts.create_mantra(owner, %{
        name: "Private mantra",
        timestamp_integer: 1_700_000_000_000
      })

    {:ok, attention} =
      Accounts.create_attention(owner, %{
        thread_id: thread.id,
        timestamp_integer: 1_700_000_000_000
      })

    {:ok, tab} =
      Accounts.create_tab(owner, %{
        count: 3,
        window_count: 1,
        timestamp_integer: 1_700_000_000_000
      })

    {:ok, search_term} =
      Accounts.create_search_term(owner, %{
        term: "private",
        timestamp_integer: 1_700_000_000_000
      })

    conn = authenticated_as(conn, intruder)

    for path <- [
          ~p"/api/traces/#{trace}",
          ~p"/api/threads/#{thread}",
          ~p"/api/activities/#{activity}",
          ~p"/api/categories/#{category}",
          ~p"/api/todos/#{todo}",
          ~p"/api/mantras/#{mantra}",
          ~p"/api/attentions/#{attention}",
          ~p"/api/tabs/#{tab}",
          ~p"/api/search_terms/#{search_term}"
        ] do
      assert_error_sent :not_found, fn -> get(conn, path) end
    end

    assert_error_sent :not_found, fn ->
      put(conn, ~p"/api/events/#{event}", %{"event" => %{"phase" => "E"}})
    end

    assert_error_sent :not_found, fn -> get(conn, ~p"/api/users/#{owner}") end
  end

  test "collection endpoints only return the signed-in user's records", %{conn: conn} do
    {:ok, owner} = Accounts.create_user(%{name: "Owner", username: "collection-owner"})
    {:ok, intruder} = Accounts.create_user(%{name: "Intruder", username: "collection-intruder"})
    {:ok, _todo} = Accounts.create_todo(owner, %{name: "Owner todo"})
    {:ok, _trace} = Traces.create_trace(owner, %{name: "Owner trace"})

    conn = authenticated_as(conn, intruder)

    for path <- [
          ~p"/api/traces",
          ~p"/api/categories",
          ~p"/api/todos",
          ~p"/api/mantras",
          ~p"/api/attentions",
          ~p"/api/tabs",
          ~p"/api/search_terms"
        ] do
      assert json_response(get(conn, path), 200) == %{"data" => []}
    end
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
