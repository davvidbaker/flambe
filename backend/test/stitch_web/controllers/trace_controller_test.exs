defmodule StitchWeb.TraceControllerTest do
  use StitchWeb.ConnCase

  alias Stitch.Traces
  alias Stitch.Traces.Trace

  @create_attrs %{name: "some name"}
  @update_attrs %{name: "some updated name"}
  @invalid_attrs %{name: nil}

  def fixture(:trace) do
    {:ok, trace} = Traces.create_trace(@create_attrs)
    trace
  end

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "index" do
    test "lists all traces", %{conn: conn} do
      conn = get conn, trace_path(conn, :index)
      assert json_response(conn, 200)["data"] == []
    end
  end

  describe "create trace" do
    test "renders trace when data is valid", %{conn: conn} do
      conn = post conn, trace_path(conn, :create), trace: @create_attrs
      assert %{"id" => id} = json_response(conn, 201)["data"]

      conn = get conn, trace_path(conn, :show, id)
      assert json_response(conn, 200)["data"] == %{
        "id" => id,
        "name" => "some name"}
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post conn, trace_path(conn, :create), trace: @invalid_attrs
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "update trace" do
    setup [:create_trace]

    test "renders trace when data is valid", %{conn: conn, trace: %Trace{id: id} = trace} do
      conn = put conn, trace_path(conn, :update, trace), trace: @update_attrs
      assert %{"id" => ^id} = json_response(conn, 200)["data"]

      conn = get conn, trace_path(conn, :show, id)
      assert json_response(conn, 200)["data"] == %{
        "id" => id,
        "name" => "some updated name"}
    end

    test "renders errors when data is invalid", %{conn: conn, trace: trace} do
      conn = put conn, trace_path(conn, :update, trace), trace: @invalid_attrs
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "delete trace" do
    setup [:create_trace]

    test "deletes chosen trace", %{conn: conn, trace: trace} do
      conn = delete conn, trace_path(conn, :delete, trace)
      assert response(conn, 204)
      assert_error_sent 404, fn ->
        get conn, trace_path(conn, :show, trace)
      end
    end
  end

  defp create_trace(_) do
    trace = fixture(:trace)
    {:ok, trace: trace}
  end
end
