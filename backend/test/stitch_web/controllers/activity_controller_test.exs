defmodule StitchWeb.ActivityControllerTest do
  use StitchWeb.ConnCase
  
    alias Stitch.Traces
    alias Stitch.Traces.{Thread, Activity}
    alias Stitch.TestHelper

    @create_attrs %{name: "some activity", description: "some description" timestamp_integer: 1509092447708}
    

    describe "create activity" do
      test "renders activity when data is valid", %conn: conn} do
        trace =
          TestHelper.create_dummy_user 
          |> TestHelper.create_dummy_trace()

        [main_thread | _tail] = 
          trace
          |> Stitch.Repo.preload(:threads)
          |> Traces.list_trace_threads
      end
    end
    
end