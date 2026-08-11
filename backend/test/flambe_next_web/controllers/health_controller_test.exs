defmodule FlambeNextWeb.HealthControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  test "returns the API health status", %{conn: conn} do
    conn = get(conn, ~p"/api/health")

    assert json_response(conn, 200) == %{"status" => "ok"}
  end
end
