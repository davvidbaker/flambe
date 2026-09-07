defmodule FlambeNextWeb.TraceThreadControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.Accounts

  test "creates traces for the current user and lists only that user's traces", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Trace User", username: "trace-user"})
    {:ok, other_user} = Accounts.create_user(%{name: "Other User", username: "other-user"})

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/traces", %{
        "user_id" => other_user.id,
        "trace" => %{"name" => "Current user's trace"}
      })

    assert %{
             "data" => %{
               "events" => [],
               "id" => trace_id,
               "name" => "Current user's trace",
               "threads" => [%{"id" => main_thread_id, "name" => "Main", "rank" => 0}]
             }
           } = json_response(conn, 201)

    conn = conn |> recycle() |> get(~p"/api/traces")

    assert json_response(conn, 200) == %{
             "data" => [%{"id" => trace_id, "name" => "Current user's trace"}]
           }

    assert is_integer(main_thread_id)
  end

  test "creating a trace seeds default categories when the user has none", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Palette Trace", username: "palette-trace"})

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/traces", %{"trace" => %{"name" => "Fresh trace"}})

    assert json_response(conn, 201)["data"]["name"] == "Fresh trace"

    conn = conn |> recycle() |> get(~p"/api/categories")

    names =
      json_response(conn, 200)["data"]
      |> Enum.map(& &1["name"])

    assert names == ["coding", "investigation", "review", "operations", "failure"]
  end

  test "creates, updates, and deletes a thread owned by the current user", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Thread User", username: "thread-user"})

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/traces", %{"trace" => %{"name" => "Thread trace"}})

    trace_id = json_response(conn, 201)["data"]["id"]

    conn =
      conn
      |> recycle()
      |> post(~p"/api/threads", %{
        "trace_id" => trace_id,
        "thread" => %{"name" => "Ideas", "rank" => 1}
      })

    assert %{"data" => %{"id" => thread_id, "name" => "Ideas", "rank" => 1}} =
             json_response(conn, 201)

    conn =
      conn
      |> recycle()
      |> put(~p"/api/threads/#{thread_id}", %{"thread" => %{"name" => "Shipped", "rank" => 2}})

    assert json_response(conn, 200) == %{
             "data" => %{"id" => thread_id, "name" => "Shipped", "rank" => 2}
           }

    conn = conn |> recycle() |> delete(~p"/api/threads/#{thread_id}")
    assert response(conn, 204) == ""
  end

  test "reorders threads owned by the current user", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Order User", username: "order-user"})

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/traces", %{"trace" => %{"name" => "Order trace"}})

    trace_id = json_response(conn, 201)["data"]["id"]
    main_id = json_response(conn, 201)["data"]["threads"] |> List.first() |> Map.fetch!("id")

    conn =
      conn
      |> recycle()
      |> post(~p"/api/threads", %{
        "trace_id" => trace_id,
        "thread" => %{"name" => "Later", "rank" => 1}
      })

    later_id = json_response(conn, 201)["data"]["id"]

    conn =
      conn
      |> recycle()
      |> put(~p"/api/traces/#{trace_id}/thread_order", %{"thread_ids" => [later_id, main_id]})

    assert json_response(conn, 200) == %{
             "data" => %{
               "threads" => [
                 %{"id" => later_id, "name" => "Later", "rank" => 0},
                 %{"id" => main_id, "name" => "Main", "rank" => 1}
               ]
             }
           }

    conn =
      conn
      |> recycle()
      |> put(~p"/api/traces/#{trace_id}/thread_order", %{"thread_ids" => [later_id]})

    assert json_response(conn, 422) == %{
             "errors" => %{
               "thread_ids" => ["must include each thread in this trace exactly once"]
             }
           }
  end

  test "does not expose or mutate another user's trace", %{conn: conn} do
    {:ok, owner} = Accounts.create_user(%{name: "Owner", username: "trace-owner"})
    {:ok, other_user} = Accounts.create_user(%{name: "Other", username: "trace-other"})
    {:ok, trace} = FlambeNext.Traces.create_trace(owner, %{name: "Private trace"})

    conn = authenticated_as(conn, other_user)

    assert_error_sent :not_found, fn ->
      get(conn, ~p"/api/traces/#{trace}")
    end

    assert_error_sent :not_found, fn ->
      delete(conn, ~p"/api/traces/#{trace}")
    end
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
