defmodule FlambeNextWeb.TimelineShareControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.Accounts

  @snapshot %{
    "version" => 1,
    "exportedAt" => 1_700_000_000_000,
    "viewport" => %{
      "leftBoundaryTime" => 1_700_000_000_000,
      "rightBoundaryTime" => 1_700_000_100_000
    },
    "fixture" => %{
      "traceId" => 1,
      "traceName" => "demo",
      "threads" => [%{"id" => 1, "name" => "main", "collapsed" => false}],
      "events" => [],
      "categories" => [],
      "attentionShifts" => []
    }
  }

  test "rejects unauthenticated create", %{conn: conn} do
    conn = post(conn, ~p"/api/timeline-shares", %{"snapshot" => @snapshot})
    assert json_response(conn, 401) == %{"error" => "UNAUTHENTICATED"}
  end

  test "uploads a snapshot and returns a public viewer URL", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Sharer", username: "timeline-share-ok"})

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/timeline-shares", %{"snapshot" => @snapshot})

    assert %{"id" => id, "url" => url} = json_response(conn, 200)
    assert url == "https://share.test/s/#{id}"
    assert String.length(id) >= 16
  end

  test "rejects a snapshot missing the viewport", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Sharer", username: "broken-share"})

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/timeline-shares", %{
        "snapshot" => Map.delete(@snapshot, "viewport")
      })

    assert json_response(conn, 422) == %{"error" => "INVALID_SNAPSHOT"}
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
