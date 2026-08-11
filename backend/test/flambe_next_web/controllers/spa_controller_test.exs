defmodule FlambeNextWeb.SpaControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  test "handles browser routes before and after the generated SPA is present", %{conn: conn} do
    conn = get(conn, "/login")

    case conn.status do
      200 ->
        assert response(conn, 200) =~ "<div id=\"app-root\"></div>"
        assert get_resp_header(conn, "content-type") == ["text/html; charset=utf-8"]

      503 ->
        assert json_response(conn, 503) == %{"error" => "FRONTEND_NOT_BUILT"}
    end
  end
end
