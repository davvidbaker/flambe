defmodule Stitch.TracesTest do
  use Stitch.DataCase

  alias Stitch.Traces

  describe "traces" do
    alias Stitch.Traces.Trace

    @valid_attrs %{name: "some name"}
    @update_attrs %{name: "some updated name"}
    @invalid_attrs %{name: nil}

    def trace_fixture(attrs \\ %{}) do
      {:ok, trace} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Traces.create_trace()

      trace
    end

    test "list_traces/0 returns all traces" do
      trace = trace_fixture()
      assert Traces.list_traces() == [trace]
    end

    test "get_trace!/1 returns the trace with given id" do
      trace = trace_fixture()
      assert Traces.get_trace!(trace.id) == trace
    end

    test "create_trace/1 with valid data creates a trace" do
      assert {:ok, %Trace{} = trace} = Traces.create_trace(@valid_attrs)
      assert trace.name == "some name"
    end

    test "create_trace/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Traces.create_trace(@invalid_attrs)
    end

    test "update_trace/2 with valid data updates the trace" do
      trace = trace_fixture()
      assert {:ok, trace} = Traces.update_trace(trace, @update_attrs)
      assert %Trace{} = trace
      assert trace.name == "some updated name"
    end

    test "update_trace/2 with invalid data returns error changeset" do
      trace = trace_fixture()
      assert {:error, %Ecto.Changeset{}} = Traces.update_trace(trace, @invalid_attrs)
      assert trace == Traces.get_trace!(trace.id)
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

    @valid_attrs %{message: "some message", phase: "some phase", timestamp: 42}
    @update_attrs %{message: "some updated message", phase: "some updated phase", timestamp: 43}
    @invalid_attrs %{message: nil, phase: nil, timestamp: nil}

    def event_fixture(attrs \\ %{}) do
      {:ok, event} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Traces.create_event()

      event
    end

    test "list_events/0 returns all events" do
      event = event_fixture()
      assert Traces.list_events() == [event]
    end

    test "get_event!/1 returns the event with given id" do
      event = event_fixture()
      assert Traces.get_event!(event.id) == event
    end

    test "create_event/1 with valid data creates a event" do
      assert {:ok, %Event{} = event} = Traces.create_event(@valid_attrs)
      assert event.message == "some message"
      assert event.phase == "some phase"
      assert event.timestamp == 42
    end

    test "create_event/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Traces.create_event(@invalid_attrs)
    end

    test "update_event/2 with valid data updates the event" do
      event = event_fixture()
      assert {:ok, event} = Traces.update_event(event, @update_attrs)
      assert %Event{} = event
      assert event.message == "some updated message"
      assert event.phase == "some updated phase"
      assert event.timestamp == 43
    end

    test "update_event/2 with invalid data returns error changeset" do
      event = event_fixture()
      assert {:error, %Ecto.Changeset{}} = Traces.update_event(event, @invalid_attrs)
      assert event == Traces.get_event!(event.id)
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

    @valid_attrs %{description: "some description", name: "some name"}
    @update_attrs %{description: "some updated description", name: "some updated name"}
    @invalid_attrs %{description: nil, name: nil}

    def activity_fixture(attrs \\ %{}) do
      {:ok, activity} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Traces.create_activity()

      activity
    end

    test "list_activities/0 returns all activities" do
      activity = activity_fixture()
      assert Traces.list_activities() == [activity]
    end

    test "get_activity!/1 returns the activity with given id" do
      activity = activity_fixture()
      assert Traces.get_activity!(activity.id) == activity
    end

    test "create_activity/1 with valid data creates a activity" do
      assert {:ok, %Activity{} = activity} = Traces.create_activity(@valid_attrs)
      assert activity.description == "some description"
      assert activity.name == "some name"
    end

    test "create_activity/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Traces.create_activity(@invalid_attrs)
    end

    test "update_activity/2 with valid data updates the activity" do
      activity = activity_fixture()
      assert {:ok, activity} = Traces.update_activity(activity, @update_attrs)
      assert %Activity{} = activity
      assert activity.description == "some updated description"
      assert activity.name == "some updated name"
    end

    test "update_activity/2 with invalid data returns error changeset" do
      activity = activity_fixture()
      assert {:error, %Ecto.Changeset{}} = Traces.update_activity(activity, @invalid_attrs)
      assert activity == Traces.get_activity!(activity.id)
    end

    test "delete_activity/1 deletes the activity" do
      activity = activity_fixture()
      assert {:ok, %Activity{}} = Traces.delete_activity(activity)
      assert_raise Ecto.NoResultsError, fn -> Traces.get_activity!(activity.id) end
    end

    test "change_activity/1 returns a activity changeset" do
      activity = activity_fixture()
      assert %Ecto.Changeset{} = Traces.change_activity(activity)
    end
  end
end
