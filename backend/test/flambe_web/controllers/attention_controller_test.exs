defmodule FlambeWeb.AttentionControllerTest do
  use FlambeWeb.ConnCase

  alias Flambe.Accounts
  alias Flambe.Accounts.Attention

  @create_attrs %{}
  @update_attrs %{}
  @invalid_attrs %{}

  def fixture(:attention) do
    {:ok, attention} = Accounts.create_attention(@create_attrs)
    attention
  end

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "index" do
    test "lists all attentions", %{conn: conn} do
      conn = get(conn, attention_path(conn, :index))
      assert json_response(conn, 200)["data"] == []
    end
  end

  describe "create attention" do
    test "renders attention when data is valid", %{conn: conn} do
      conn = post(conn, attention_path(conn, :create), attention: @create_attrs)
      assert %{"id" => id} = json_response(conn, 201)["data"]

      conn = get(conn, attention_path(conn, :show, id))
      assert json_response(conn, 200)["data"] == %{"id" => id}
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, attention_path(conn, :create), attention: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "update attention" do
    setup [:create_attention]

    test "renders attention when data is valid", %{
      conn: conn,
      attention: %Attention{id: id} = attention
    } do
      conn = put(conn, attention_path(conn, :update, attention), attention: @update_attrs)
      assert %{"id" => ^id} = json_response(conn, 200)["data"]

      conn = get(conn, attention_path(conn, :show, id))
      assert json_response(conn, 200)["data"] == %{"id" => id}
    end

    test "renders errors when data is invalid", %{conn: conn, attention: attention} do
      conn = put(conn, attention_path(conn, :update, attention), attention: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "delete attention" do
    setup [:create_attention]

    test "deletes chosen attention", %{conn: conn, attention: attention} do
      conn = delete(conn, attention_path(conn, :delete, attention))
      assert response(conn, 204)

      assert_error_sent(404, fn ->
        get(conn, attention_path(conn, :show, attention))
      end)
    end
  end

  defp create_attention(_) do
    attention = fixture(:attention)
    {:ok, attention: attention}
  end
end
