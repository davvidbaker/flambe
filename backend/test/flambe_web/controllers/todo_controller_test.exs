defmodule FlambeWeb.TodoControllerTest do
  use FlambeWeb.ConnCase

  alias Flambe.Accounts
  alias Flambe.Accounts.Todo

  @create_attrs %{description: "some description", name: "some name"}
  @update_attrs %{description: "some updated description", name: "some updated name"}
  @invalid_attrs %{description: nil, name: nil}

  def fixture(:todo) do
    {:ok, todo} = Accounts.create_todo(@create_attrs)
    todo
  end

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "index" do
    test "lists all todos", %{conn: conn} do
      conn = get(conn, todo_path(conn, :index))
      assert json_response(conn, 200)["data"] == []
    end
  end

  describe "create todo" do
    test "renders todo when data is valid", %{conn: conn} do
      conn = post(conn, todo_path(conn, :create), todo: @create_attrs)
      assert %{"id" => id} = json_response(conn, 201)["data"]

      conn = get(conn, todo_path(conn, :show, id))

      assert json_response(conn, 200)["data"] == %{
               "id" => id,
               "description" => "some description",
               "name" => "some name"
             }
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, todo_path(conn, :create), todo: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "update todo" do
    setup [:create_todo]

    test "renders todo when data is valid", %{conn: conn, todo: %Todo{id: id} = todo} do
      conn = put(conn, todo_path(conn, :update, todo), todo: @update_attrs)
      assert %{"id" => ^id} = json_response(conn, 200)["data"]

      conn = get(conn, todo_path(conn, :show, id))

      assert json_response(conn, 200)["data"] == %{
               "id" => id,
               "description" => "some updated description",
               "name" => "some updated name"
             }
    end

    test "renders errors when data is invalid", %{conn: conn, todo: todo} do
      conn = put(conn, todo_path(conn, :update, todo), todo: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "delete todo" do
    setup [:create_todo]

    test "deletes chosen todo", %{conn: conn, todo: todo} do
      conn = delete(conn, todo_path(conn, :delete, todo))
      assert response(conn, 204)

      assert_error_sent(404, fn ->
        get(conn, todo_path(conn, :show, todo))
      end)
    end
  end

  defp create_todo(_) do
    todo = fixture(:todo)
    {:ok, todo: todo}
  end
end
