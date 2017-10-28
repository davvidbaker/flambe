defmodule StitchWeb.ActivityControllerTest do
  use StitchWeb.ConnCase
  
    alias Stitch.Traces
    alias Stitch.Traces.Activity
    alias Stitch.TestHelper

    @create_attrs %{name: "some activity", description: "some description"}
    @update_attrs %{name: "some updated activity", description: "some updated description"}
    @invalid_attrs %{name: nil}

    def fixture(:activity) do
      trace = 
      TestHelper.create_dummy_user 
        |> TestHelper.create_dummy_trace

      [main_thread | _tail] = 
        trace
        |> Stitch.Repo.preload(:threads)
        |> Traces.list_trace_threads

        {:ok, %Activity{} = activity} = Traces.create_activity(main_thread.id, @create_attrs)
        activity
    end
    

    describe "create activity" do
      test "renders activity when data is valid", %{conn: conn} do
        trace =
          TestHelper.create_dummy_user 
          |> TestHelper.create_dummy_trace

        [main_thread | _tail] = 
          trace
          |> Stitch.Repo.preload(:threads)
          |> Traces.list_trace_threads

          # {:ok, %Activity{id: activity_id}} =
          # Traces.create_activity(main_thread.id, %{name: "my little activity", description: "my little description of my little activity"})

          conn = post conn, activity_path(conn, :create), %{thread_id: main_thread.id, trace_id: trace.id, activity: @create_attrs, event: %{timestamp_integer: 1509092447708}}

          assert %{"id" => id} = json_response(conn, 201)["data"]
          
          conn = get conn, activity_path(conn, :show, id)
          assert json_response(conn, 200)["data"] == %{
            "id" => id,
            "name" => "some activity",
            "description" => "some description"
          }
      end
    end

    describe "delete activity" do
      setup [:create_activity]
    
      # ⚠️ I should also be checking that I am deleting the events associated with the activity, but I am not checking that yet!
      test "deletes chosen activity", %{conn: conn, activity: activity} do
        conn = delete conn, activity_path(conn, :delete, activity)
        assert response(conn, 204)
        assert_error_sent 404, fn ->
          get conn, activity_path(conn, :show, activity)
        end
      end
    end

    describe "update activity" do
      setup [:create_activity]

      test "renders activity when data is valid", %{conn: conn, activity: %Activity{id: id} = activity} do
        conn = put conn, activity_path(conn, :update, activity), activity: @update_attrs

        assert %{"id" => ^id} = json_response(conn, 200)["data"]

        conn = get conn, activity_path(conn, :show, id)
        assert json_response(conn, 200)["data"] == %{
          "id" => id,
          "name" => "some updated activity",
          "description" => "some updated description"
        }
      end
  
      test "renders errors when data is invalid", %{conn: conn, activity: activity} do
        conn = put conn, activity_path(conn, :update, activity), activity: @invalid_attrs
        assert json_response(conn, 422)["errors"] != %{}
      end
      
    end

    defp create_activity(_) do
      activity = fixture(:activity)
      {:ok, activity: activity}
    end

    
end