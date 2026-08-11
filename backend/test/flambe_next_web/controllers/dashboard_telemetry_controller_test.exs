defmodule FlambeNextWeb.DashboardTelemetryControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, Traces}

  test "manages dashboard telemetry for the signed-in user", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Telemetry User", username: "telemetry-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Telemetry trace"})
    [main_thread] = Traces.get_user_trace!(user, trace.id).threads

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/mantras", %{
        "user_id" => 999,
        "mantra" => %{"name" => "Focus", "timestamp_integer" => 1_700_000_000_000}
      })

    assert %{"data" => %{"id" => mantra_id, "name" => "Focus"}} = json_response(conn, 201)

    conn =
      conn
      |> recycle()
      |> post(~p"/api/attentions", %{
        "attention" => %{"thread_id" => main_thread.id, "timestamp_integer" => 1_700_000_001_000}
      })

    assert %{"data" => %{"id" => attention_id}} = json_response(conn, 201)

    conn =
      conn
      |> recycle()
      |> post(~p"/api/tabs", %{
        "tabs" => %{
          "count" => 12,
          "window_count" => 3,
          "timestamp_integer" => 1_700_000_002_000
        }
      })

    assert %{"data" => %{"count" => 12, "id" => tab_id}} = json_response(conn, 201)

    conn =
      conn
      |> recycle()
      |> post(~p"/api/search_terms", %{
        "search_term" => %{"term" => "phoenix", "timestamp_integer" => 1_700_000_003_000}
      })

    assert %{"data" => %{"id" => search_term_id, "term" => "phoenix", "timestamp" => _timestamp}} =
             json_response(conn, 201)

    conn = conn |> recycle() |> get(~p"/api/users/#{user}")

    assert %{
             "data" => %{
               "attentionShifts" => [
                 %{"id" => ^attention_id, "thread_id" => main_thread_id, "timestamp" => _}
               ],
               "mantras" => [%{"id" => ^mantra_id, "name" => "Focus", "timestamp" => _}],
               "searchTerms" => [
                 %{"id" => ^search_term_id, "term" => "phoenix", "timestamp" => _}
               ],
               "tabs" => [
                 %{"count" => 12, "id" => ^tab_id, "timestamp" => _, "window_count" => 3}
               ]
             }
           } = json_response(conn, 200)

    assert main_thread_id == main_thread.id

    conn =
      conn |> recycle() |> put(~p"/api/mantras/#{mantra_id}", %{"mantra" => %{"name" => "Ship"}})

    assert json_response(conn, 200) == %{"data" => %{"id" => mantra_id, "name" => "Ship"}}

    conn = conn |> recycle() |> delete(~p"/api/mantras/#{mantra_id}")
    assert response(conn, 204) == ""
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
