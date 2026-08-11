defmodule FlambeNextWeb.TodoControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.Accounts

  test "manages a signed-in user's todos and returns them in the dashboard", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Todo User", username: "todo-user"})

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/todos", %{
        "user_id" => 999,
        "todo" => %{"name" => "Write tests", "description" => "For Phoenix"}
      })

    assert %{
             "data" => %{"description" => "For Phoenix", "id" => todo_id, "name" => "Write tests"}
           } =
             json_response(conn, 201)

    conn =
      conn |> recycle() |> put(~p"/api/todos/#{todo_id}", %{"todo" => %{"name" => "Ship tests"}})

    assert json_response(conn, 200) == %{
             "data" => %{"description" => "For Phoenix", "id" => todo_id, "name" => "Ship tests"}
           }

    conn = conn |> recycle() |> get(~p"/api/users/#{user}")

    assert %{"data" => %{"todos" => [%{"id" => ^todo_id, "name" => "Ship tests"}]}} =
             json_response(conn, 200)

    conn = conn |> recycle() |> delete(~p"/api/todos/#{todo_id}")
    assert response(conn, 204) == ""
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
