defmodule Stitch.TracesTest do
  use Stitch.DataCase

  alias Stitch.{Traces, TestHelper}

  describe "traces" do
    alias Stitch.Traces.Trace

    @valid_attrs %{name: "some trace name"}
    @update_attrs %{name: "some updated trace name"}
    @invalid_attrs %{name: nil}

    def trace_fixture(attrs \\ @valid_attrs) do
      user = TestHelper.create_dummy_user
      
      {:ok, trace} =
        user
        |> Traces.create_trace(attrs)

      trace
    end

    test "list_traces/0 returns all traces" do
      trace = trace_fixture(@valid_attrs)
      assert Enum.map(Traces.list_traces, fn x -> x.id end) == Enum.map([trace], fn x -> x.id end)
    end

    test "get_trace!/1 returns the trace with given id" do
      trace = trace_fixture(@valid_attrs)
      assert Traces.get_trace!(trace.id).id == trace.id
    end

    test "create_trace/1 with valid data creates a trace" do
      trace = trace_fixture(@valid_attrs)
      assert trace.name == "some trace name"
    end

    test "create_trace/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = TestHelper.create_dummy_user |> Traces.create_trace(@invalid_attrs)
    end

    test "update_trace/2 with valid data updates the trace" do
      trace = trace_fixture()
      assert {:ok, trace} = Traces.update_trace(trace, @update_attrs)
      assert %Trace{} = trace
      assert trace.name == "some updated trace name"
    end

    test "update_trace/2 with invalid data returns error changeset" do
      trace = trace_fixture()
      assert {:error, %Ecto.Changeset{}} = Traces.update_trace(trace, @invalid_attrs)
      assert trace.id == Traces.get_trace!(trace.id).id
    end

    test "delete_trace/1 deletes the trace" do
      trace = trace_fixture()
      assert {:ok, %Trace{}} = Traces.delete_trace(trace)
      assert_raise Ecto.NoResultsError, fn -> Traces.get_trace!(trace.id) end
    end

    test "change_trace/1 returns a trace changeset" do
      trace = trace_fixture()
      assert %Ecto.Changeset{} = Traces.change_trace(trace)
    end
  end

  describe "events" do
    alias Stitch.Traces.Event

    @valid_attrs %{message: "some message", phase: "some phase", timestamp_integer: 1509161022983}
    @update_attrs %{message: "some updated message", phase: "some updated phase", timestamp_integer: 2509161022983}
    @invalid_attrs %{message: nil, phase: nil, timestamp_integer: nil}

    def event_fixture(attrs \\ @valid_attrs) do
      trace = TestHelper.create_dummy_user |> TestHelper.create_dummy_trace
      
      {:ok, event} =
        trace.id
        |> Traces.create_event(attrs)

      event
    end

    test "list_events/0 returns all events" do
      event = event_fixture()
      assert Enum.map(Traces.list_events(), fn x -> x.id end) == Enum.map([event], fn x -> x.id end)
    end

    test "get_event!/1 returns the event with given id" do
      event = event_fixture()
      assert Traces.get_event!(event.id).id == event.id
    end

    test "create_event/1 with valid data creates a event" do
      assert {:ok, %Event{} = event} = {:ok, event_fixture()}
      assert event.message == "some message"
      assert event.phase == "some phase"
      assert event.timestamp == 1509161022983 |> Ecto.DateTime.from_unix!(1000)
    end

    test "create_event/1 with invalid data returns error changeset" do
      trace = TestHelper.create_dummy_user |> TestHelper.create_dummy_trace
      
      assert {:error, %Ecto.Changeset{}} = Traces.create_event(trace.id, @invalid_attrs)
    end

    test "update_event/2 with valid data updates the event" do
      event = event_fixture()
      assert {:ok, event} = Traces.update_event(event, @update_attrs)
      assert %Event{} = event
      assert event.message == "some updated message"
      assert event.phase == "some updated phase"
      assert event.timestamp == 2509161022983 |> Ecto.DateTime.from_unix!(1000)
    end

    test "update_event/2 with invalid data returns error changeset" do
      event = event_fixture()
      assert {:error, %Ecto.Changeset{}} = Traces.update_event(event, @invalid_attrs)
      assert event.id == Traces.get_event!(event.id).id
    end

    test "delete_event/1 deletes the event" do
      event = event_fixture()
      assert {:ok, %Event{}} = Traces.delete_event(event)
      assert_raise Ecto.NoResultsError, fn -> Traces.get_event!(event.id) end
    end

    test "change_event/1 returns a event changeset" do
      event = event_fixture()
      assert %Ecto.Changeset{} = Traces.change_event(event)
    end
  end

  describe "activities" do
    alias Stitch.Traces.Activity

    @valid_attrs %{description: "some description", name: "some activity name"}
    @update_attrs %{description: "some updated description", name: "some updated activity name"}
    @invalid_attrs %{description: nil, name: nil}

    def activity_fixture(attrs \\ @valid_attrs) do
      activity = 
        TestHelper.create_dummy_user 
        |> TestHelper.create_dummy_trace 
        |> TestHelper.create_dummy_activity(attrs)
      
      activity
    end

    test "list_activities/0 returns all activities" do
      activity = activity_fixture()
      assert Enum.map(Traces.list_activities(), fn x -> x.id end) == Enum.map([activity], fn x -> x.id end)
    end

    test "get_activity!/1 returns the activity with given id" do
      activity = activity_fixture()
      assert Traces.get_activity!(activity.id).id == activity.id
    end

    test "create_activity/1 with valid data creates a activity" do
      assert {:ok, %Activity{} = activity} = {:ok, activity_fixture()}
      assert activity.description == "some description"
      assert activity.name == "some activity name"
    end

    test "create_activity/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = activity_fixture(@invalid_attrs)
    end

    test "update_activity/2 with valid data updates the activity" do
      activity = activity_fixture()
      assert {:ok, activity} = Traces.update_activity(activity, @update_attrs)
      assert %Activity{} = activity
      assert activity.description == "some updated description"
      assert activity.name == "some updated activity name"
    end

    test "update_activity/2 with invalid data returns error changeset" do     
      activity = activity_fixture()
      assert {:error, %Ecto.Changeset{}} = Traces.update_activity(activity, @invalid_attrs)
      assert activity.id == Traces.get_activity!(activity.id).id
    end

    test "delete_activity/1 deletes the activity" do
      activity = activity_fixture()
      assert {:ok, %Activity{}} = Traces.delete_activity(activity)
      assert_raise Ecto.NoResultsError, fn -> Traces.get_activity!(activity.id) end
    end

  end

  describe "threads" do
    alias Stitch.Traces.Thread

    @valid_attrs %{name: "some thread name"}
    @update_attrs %{name: "some updated thread name"}
    @invalid_attrs %{name: nil}

    def thread_fixture(attrs \\ @valid_attrs) do
      trace = TestHelper.create_dummy_user |> TestHelper.create_dummy_trace
      
      {:ok, thread} =
        trace.id
        |> Traces.create_thread(attrs)

      thread
    end

    test "list_threads/0 returns all threads" do
      thread = thread_fixture()
      [_first_thread_id, second_thread_id] = Enum.map(Traces.list_threads(), fn x -> x.id end) 
      [thread_id] = Enum.map([thread], fn x -> x.id end)
      assert thread_id == second_thread_id
    end

    test "get_thread!/1 returns the thread with given id" do
      thread = thread_fixture()
      assert Traces.get_thread!(thread.id).id == thread.id
    end

    test "create_thread/1 with valid data creates a thread" do
      assert {:ok, %Thread{} = thread} = {:ok, thread_fixture()}
      assert thread.name == "some thread name"
    end

    test "create_thread/1 with invalid data returns error changeset" do
      trace = TestHelper.create_dummy_user |> TestHelper.create_dummy_trace
      assert {:error, %Ecto.Changeset{}} = Traces.create_thread(trace.id, @invalid_attrs)
    end

    test "update_thread/2 with valid data updates the thread" do
      thread = thread_fixture()
      assert {:ok, thread} = Traces.update_thread(thread, @update_attrs)
      assert %Thread{} = thread
      assert thread.name == "some updated thread name"
    end

    test "update_thread/2 with invalid data returns error changeset" do
      thread = thread_fixture()
      assert {:error, %Ecto.Changeset{}} = Traces.update_thread(thread, @invalid_attrs)
      assert thread.id == Traces.get_thread!(thread.id).id
    end

    test "delete_thread/1 deletes the thread" do
      thread = thread_fixture()
      assert {:ok, %Thread{}} = Traces.delete_thread(thread)
      assert_raise Ecto.NoResultsError, fn -> Traces.get_thread!(thread.id) end
    end

    test "change_thread/1 returns a thread changeset" do
      thread = thread_fixture()
      assert %Ecto.Changeset{} = Traces.change_thread(thread)
    end
  end
end
