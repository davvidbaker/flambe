defmodule FlambeWeb.ThreadControllerTest do
  use FlambeWeb.ConnCase

  alias Flambe.Traces
  alias Flambe.Traces.{Thread, Trace}
  alias Flambe.TestHelper

  @create_attrs %{name: "some thread name"}
  @update_attrs %{name: "some updated thread name"}
  @invalid_attrs %{name: nil}

  def fixture(:thread) do
    %Trace{id: trace_id} =
      TestHelper.create_dummy_user()
      |> TestHelper.create_dummy_trace()

    #  ⚠️ I doubt this is the right way to go about this
    {:ok, thread} = Traces.create_thread(trace_id, @create_attrs)

    thread
  end

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "index" do
    test "lists all threads", %{conn: conn} do
      conn = get(conn, thread_path(conn, :index))
      assert json_response(conn, 200)["data"] == []
    end
  end

  describe "create thread" do
    test "renders thread when data is valid", %{conn: conn} do
      %Trace{id: trace_id} =
        TestHelper.create_dummy_user()
        |> TestHelper.create_dummy_trace()

      conn = post(conn, thread_path(conn, :create), %{trace_id: trace_id, thread: @create_attrs})
      assert %{"id" => id} = json_response(conn, 201)["data"]

      conn = get(conn, thread_path(conn, :show, id))
      assert json_response(conn, 200)["data"] == %{"id" => id, "name" => "some thread name"}
    end

    test "renders errors when data is invalid", %{conn: conn} do
      %Trace{id: trace_id} =
        TestHelper.create_dummy_user()
        |> TestHelper.create_dummy_trace()

      conn = post(conn, thread_path(conn, :create), %{trace_id: trace_id, thread: @invalid_attrs})
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "update thread" do
    setup [:create_thread]

    test "renders thread when data is valid", %{conn: conn, thread: %Thread{id: id} = thread} do
      conn = put(conn, thread_path(conn, :update, thread), %{id: id, thread: @update_attrs})
      assert %{"id" => ^id} = json_response(conn, 200)["data"]

      conn = get(conn, thread_path(conn, :show, id))

      assert json_response(conn, 200)["data"] == %{
               "id" => id,
               "name" => "some updated thread name"
             }
    end

    test "renders errors when data is invalid", %{conn: conn, thread: thread} do
      conn = put(conn, thread_path(conn, :update, thread), thread: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "delete thread" do
    setup [:create_thread]

    test "deletes chosen thread", %{conn: conn, thread: thread} do
      conn = delete(conn, thread_path(conn, :delete, thread))
      assert response(conn, 204)

      assert_error_sent(404, fn ->
        get(conn, thread_path(conn, :show, thread))
      end)
    end
  end

  defp create_thread(_) do
    thread = fixture(:thread)
    {:ok, thread: thread}
  end
end
