defmodule SteadyWeb.SearchTermControllerTest do
  use SteadyWeb.ConnCase

  alias Flambe.Accounts
  alias Flambe.Accounts.SearchTerm

  @create_attrs %{term: "some term", timestamp: "2010-04-17 14:00:00.000000Z"}
  @update_attrs %{term: "some updated term", timestamp: "2011-05-18 15:01:01.000000Z"}
  @invalid_attrs %{term: nil, timestamp: nil}

  def fixture(:search_term) do
    {:ok, search_term} = Accounts.create_search_term(@create_attrs)
    search_term
  end

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "index" do
    test "lists all search_term", %{conn: conn} do
      conn = get(conn, search_term_path(conn, :index))
      assert json_response(conn, 200)["data"] == []
    end
  end

  describe "create search_term" do
    test "renders search_term when data is valid", %{conn: conn} do
      conn = post(conn, search_term_path(conn, :create), search_term: @create_attrs)
      assert %{"id" => id} = json_response(conn, 201)["data"]

      conn = get(conn, search_term_path(conn, :show, id))

      assert json_response(conn, 200)["data"] == %{
               "id" => id,
               "term" => "some term",
               "timestamp" => "2010-04-17 14:00:00.000000Z"
             }
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, search_term_path(conn, :create), search_term: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "update search_term" do
    setup [:create_search_term]

    test "renders search_term when data is valid", %{
      conn: conn,
      search_term: %SearchTerm{id: id} = search_term
    } do
      conn = put(conn, search_term_path(conn, :update, search_term), search_term: @update_attrs)
      assert %{"id" => ^id} = json_response(conn, 200)["data"]

      conn = get(conn, search_term_path(conn, :show, id))

      assert json_response(conn, 200)["data"] == %{
               "id" => id,
               "term" => "some updated term",
               "timestamp" => "2011-05-18 15:01:01.000000Z"
             }
    end

    test "renders errors when data is invalid", %{conn: conn, search_term: search_term} do
      conn = put(conn, search_term_path(conn, :update, search_term), search_term: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "delete search_term" do
    setup [:create_search_term]

    test "deletes chosen search_term", %{conn: conn, search_term: search_term} do
      conn = delete(conn, search_term_path(conn, :delete, search_term))
      assert response(conn, 204)

      assert_error_sent(404, fn ->
        get(conn, search_term_path(conn, :show, search_term))
      end)
    end
  end

  defp create_search_term(_) do
    search_term = fixture(:search_term)
    {:ok, search_term: search_term}
  end
end
