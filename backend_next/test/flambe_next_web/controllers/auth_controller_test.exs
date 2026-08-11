defmodule FlambeNextWeb.AuthControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, Traces}

  test "logs in a local user and preserves the trace response contract", %{conn: conn} do
    {:ok, user} =
      Accounts.register_user(%{
        name: "Contract User",
        username: "contract-user",
        credentials: [%{email: "contract@example.com", password: "password123"}]
      })

    {:ok, trace} = Traces.create_trace(user, %{name: "Contract trace"})
    {:ok, _thread} = Traces.create_thread(trace, %{name: "Regression thread", rank: 1})

    conn =
      post(conn, ~p"/auth/identity/callback", %{
        email: "contract@example.com",
        password: "password123"
      })

    assert %{"data" => %{"id" => user_id, "trace_id" => trace_id, "username" => "contract-user"}} =
             json_response(conn, 200)

    assert user_id == user.id
    assert trace_id == trace.id

    session_cookie = get_resp_header(conn, "set-cookie") |> Enum.join("\n")
    assert session_cookie =~ "HttpOnly"
    assert session_cookie =~ "SameSite=Lax"

    conn = conn |> recycle() |> get(~p"/api/traces/#{trace}")

    assert json_response(conn, 200)["data"]["name"] == "Contract trace"
  end

  test "rejects invalid local credentials", %{conn: conn} do
    conn =
      post(conn, ~p"/auth/identity/callback", %{
        email: "missing@example.com",
        password: "password123"
      })

    assert json_response(conn, 401) == %{"error" => "INVALID_CREDENTIALS"}
  end

  test "requires a signed-in user for trace reads", %{conn: conn} do
    conn = get(conn, ~p"/api/traces/1")

    assert json_response(conn, 401) == %{"error" => "UNAUTHENTICATED"}
  end
end
