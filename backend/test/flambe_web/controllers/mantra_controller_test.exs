defmodule FlambeWeb.MantraControllerTest do
  use FlambeWeb.ConnCase

  alias Flambe.Accounts
  alias Flambe.Accounts.Mantra

  @create_attrs %{name: "some name"}
  @update_attrs %{name: "some updated name"}
  @invalid_attrs %{name: nil}

  def fixture(:mantra) do
    {:ok, mantra} = Accounts.create_mantra(@create_attrs)
    mantra
  end

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "index" do
    test "lists all mantras", %{conn: conn} do
      conn = get(conn, mantra_path(conn, :index))
      assert json_response(conn, 200)["data"] == []
    end
  end

  describe "create mantra" do
    test "renders mantra when data is valid", %{conn: conn} do
      conn = post(conn, mantra_path(conn, :create), mantra: @create_attrs)
      assert %{"id" => id} = json_response(conn, 201)["data"]

      conn = get(conn, mantra_path(conn, :show, id))
      assert json_response(conn, 200)["data"] == %{"id" => id, "name" => "some name"}
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, mantra_path(conn, :create), mantra: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "update mantra" do
    setup [:create_mantra]

    test "renders mantra when data is valid", %{conn: conn, mantra: %Mantra{id: id} = mantra} do
      conn = put(conn, mantra_path(conn, :update, mantra), mantra: @update_attrs)
      assert %{"id" => ^id} = json_response(conn, 200)["data"]

      conn = get(conn, mantra_path(conn, :show, id))
      assert json_response(conn, 200)["data"] == %{"id" => id, "name" => "some updated name"}
    end

    test "renders errors when data is invalid", %{conn: conn, mantra: mantra} do
      conn = put(conn, mantra_path(conn, :update, mantra), mantra: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "delete mantra" do
    setup [:create_mantra]

    test "deletes chosen mantra", %{conn: conn, mantra: mantra} do
      conn = delete(conn, mantra_path(conn, :delete, mantra))
      assert response(conn, 204)

      assert_error_sent(404, fn ->
        get(conn, mantra_path(conn, :show, mantra))
      end)
    end
  end

  defp create_mantra(_) do
    mantra = fixture(:mantra)
    {:ok, mantra: mantra}
  end
end
