defmodule SteadyWeb.TabsControllerTest do
  use SteadyWeb.ConnCase

  alias Flambe.Accounts
  alias Flambe.Accounts.Tabs

  @create_attrs %{count: 42}
  @update_attrs %{count: 43}
  @invalid_attrs %{count: nil}

  def fixture(:tabs) do
    {:ok, tabs} = Accounts.create_tabs(@create_attrs)
    tabs
  end

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "index" do
    test "lists all tabs", %{conn: conn} do
      conn = get(conn, tabs_path(conn, :index))
      assert json_response(conn, 200)["data"] == []
    end
  end

  describe "create tabs" do
    test "renders tabs when data is valid", %{conn: conn} do
      conn = post(conn, tabs_path(conn, :create), tabs: @create_attrs)
      assert %{"id" => id} = json_response(conn, 201)["data"]

      conn = get(conn, tabs_path(conn, :show, id))
      assert json_response(conn, 200)["data"] == %{"id" => id, "count" => 42}
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, tabs_path(conn, :create), tabs: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "update tabs" do
    setup [:create_tabs]

    test "renders tabs when data is valid", %{conn: conn, tabs: %Tabs{id: id} = tabs} do
      conn = put(conn, tabs_path(conn, :update, tabs), tabs: @update_attrs)
      assert %{"id" => ^id} = json_response(conn, 200)["data"]

      conn = get(conn, tabs_path(conn, :show, id))
      assert json_response(conn, 200)["data"] == %{"id" => id, "count" => 43}
    end

    test "renders errors when data is invalid", %{conn: conn, tabs: tabs} do
      conn = put(conn, tabs_path(conn, :update, tabs), tabs: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "delete tabs" do
    setup [:create_tabs]

    test "deletes chosen tabs", %{conn: conn, tabs: tabs} do
      conn = delete(conn, tabs_path(conn, :delete, tabs))
      assert response(conn, 204)

      assert_error_sent(404, fn ->
        get(conn, tabs_path(conn, :show, tabs))
      end)
    end
  end

  defp create_tabs(_) do
    tabs = fixture(:tabs)
    {:ok, tabs: tabs}
  end
end
