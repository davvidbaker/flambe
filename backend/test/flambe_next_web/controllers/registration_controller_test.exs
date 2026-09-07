defmodule FlambeNextWeb.RegistrationControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  test "registers a local user with a Main trace that can be logged into", %{conn: conn} do
    conn =
      post(conn, ~p"/api/register", %{
        "invite_code" => "test-invite",
        "user" => %{
          "name" => "New User",
          "username" => "new-user",
          "credentials" => [%{"email" => "new@example.com", "password" => "password123"}]
        }
      })

    assert %{
             "data" => %{
               "id" => user_id,
               "name" => "New User",
               "traces" => [%{"id" => trace_id, "name" => "Main"}],
               "username" => "new-user"
             }
           } = json_response(conn, 201)

    conn =
      conn
      |> recycle()
      |> post(~p"/auth/identity/callback", %{email: "new@example.com", password: "password123"})

    assert json_response(conn, 200) == %{
             "data" => %{"id" => user_id, "trace_id" => trace_id, "username" => "new-user"}
           }

    conn =
      conn
      |> recycle()
      |> post(~p"/api/register", %{
        "invite_code" => "test-invite",
        "user" => %{
          "name" => "Second User",
          "username" => "second-user",
          "credentials" => [%{"email" => "second@example.com", "password" => "password123"}]
        }
      })

    assert %{"data" => %{"traces" => [%{"name" => "Main"}]}} = json_response(conn, 201)

    conn = conn |> recycle() |> delete(~p"/auth/logout")
    assert response(conn, 204) == ""

    conn = conn |> recycle() |> get(~p"/api/users/#{user_id}")
    assert json_response(conn, 401) == %{"error" => "UNAUTHENTICATED"}
  end

  test "seeds default categories for a newly registered user", %{conn: conn} do
    conn =
      post(conn, ~p"/api/register", %{
        "invite_code" => "test-invite",
        "user" => %{
          "name" => "Palette User",
          "username" => "palette-user",
          "credentials" => [%{"email" => "palette@example.com", "password" => "password123"}]
        }
      })

    assert %{"data" => %{"id" => user_id}} = json_response(conn, 201)

    conn =
      conn
      |> recycle()
      |> post(~p"/auth/identity/callback", %{
        email: "palette@example.com",
        password: "password123"
      })

    assert json_response(conn, 200)["data"]["id"] == user_id

    conn = conn |> recycle() |> get(~p"/api/categories")

    names =
      json_response(conn, 200)["data"]
      |> Enum.map(& &1["name"])

    assert names == ["coding", "investigation", "review", "operations", "failure"]
  end

  test "rejects registration without a valid invite code", %{conn: conn} do
    params = %{
      "user" => %{
        "name" => "Blocked User",
        "username" => "blocked-user",
        "credentials" => [%{"email" => "blocked@example.com", "password" => "password123"}]
      }
    }

    conn = post(conn, ~p"/api/register", params)
    assert json_response(conn, 422) == %{"errors" => %{"invite_code" => ["is invalid"]}}

    conn =
      build_conn()
      |> post(~p"/api/register", Map.put(params, "invite_code", "wrong-invite"))

    assert json_response(conn, 422) == %{"errors" => %{"invite_code" => ["is invalid"]}}
  end
end
