# 💁 Right now you can only create events. They can't be changed.

defmodule StitchWeb.EventControllerTest do 
  use StitchWeb.ConnCase  

  alias Stitch.Traces
  alias Stitch.Traces.{Activity, Trace}
  alias Stitch.TestHelper

  # 💁 The only way a begin event is created is when a new activity is created.
  # @create_begin_attrs %{phase: "B", timestamp_integer: 1509092227708, message: ""}
  @create_end_attrs %{phase: "E", timestamp_integer: 1509092447708, message: ""}
  
  # @update_attrs %{name: "some updated thread name"}
  @invalid_attrs %{name: nil}

  # ⚠️ I don't know how and when to use fixtures yet
  def activity_fixture(:event) do
    # trace =
    #   TestHelper.create_dummy_user 
    #   |> TestHelper.create_dummy_trace()

    # [main_thread | _tail] = Traces.list_trace_threads(trace)
    
    # %Activity{id: activity_id} =
    #   Traces.create_activity(main_thread.id, %{name: "my little activity", description: "my little description of my little activity"})

    #   {:ok, event} = Traces.create_event(trace.id, activity_id, @create_attrs)
    #   event
  end

  describe "create end event" do

    test "renders event when data is valid", %{conn: conn} do

      trace =
        TestHelper.create_dummy_user 
        |> TestHelper.create_dummy_trace

      [main_thread | _tail] = 
        trace
        |> Stitch.Repo.preload(:threads)
        |> Traces.list_trace_threads

      {:ok, %Activity{id: activity_id}} =
        Traces.create_activity(main_thread.id, %{name: "my little activity", description: "my little description of my little activity"})
      
      conn = post conn, event_path(conn, :create), %{trace_id: trace.id, activity_id: activity_id, event: @create_end_attrs}
      assert %{"id" => id} = json_response(conn, 201)["data"]      
    end

  end
    

  defp create_activity(_) do
    activity = activity_fixture(:activity)
    {:ok, activity: activity}
  end

  
end

