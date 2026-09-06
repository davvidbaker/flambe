defmodule FlambeNextWeb.HealthControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  test "returns the API health status", %{conn: conn} do
    conn = get(conn, ~p"/api/health")

    response = json_response(conn, 200)

    assert response == %{
             "status" => "ok",
             "git_sha" => FlambeNext.BuildInfo.git_sha()
           }
  end
end
