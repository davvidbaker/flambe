defmodule FlambeWeb.ActivityController do
  use FlambeWeb, :controller

  alias Flambe.{Traces, Accounts}
  alias Flambe.Traces.{Activity, Event, Thread, Trace}

  action_fallback(FlambeWeb.FallbackController)

  def create(conn, %{
        "thread_id" => thread_id,
        "todo_id" => todo_id,
        "event" => event_params,
        "activity" => activity_params
      }) do
    if !is_nil(todo_id) do
      Accounts.delete_todo(Accounts.get_todo!(todo_id))
    end

    # IO.inspect(Traces.get_thread!(thread_id))

    # thread = Traces.get_thread!(thread_id)
    # IO.puts("\n🔥 thread)")
    # IO.inspect(thread)

    # {:ok, %Activity{} = activity, %Event{} = event} =
    #   Traces.create_activity(thread, activity_params, event_params)

    # IO.puts("\n🔥 )")
    # IO.inspect(activity)

    # conn |> put_status(:created) |> render("show.json", activity: activity, event: event)
    #        Traces.create_activity(thread, activity_params, event_params)

    with thread <- Traces.get_thread!(thread_id),
         {:ok, %Activity{} = activity, %Event{} = event} <-
           Traces.create_activity(thread, activity_params, event_params) do
      conn
      |> put_status(:created)
      |> render("show.json", activity: activity, event: event)
    end
  end

  def show(conn, %{"id" => id}) do
    activity = Traces.get_activity!(id)
    render(conn, "show.json", activity: activity)
  end

  # 🔮 will fail next test probably
  def delete(conn, %{"id" => id, "delete_events" => delete_events}) do
    activity = Traces.get_activity_with_events(id)

    if delete_events do
      for evt <- activity.events do
        Traces.delete_event(evt)
      end
    end

    with {:ok, %Activity{}} <- Traces.delete_activity(activity) do
      send_resp(conn, :no_content, "")
    end
  end

  def update(conn, %{"id" => id, "activity" => activity_params}) do
    activity = Traces.get_activity!(id)
    IO.puts("\nactivity_params")
    IO.inspect(activity_params)

    with {:ok, %Activity{}} <- Traces.update_activity(activity, activity_params) do
      render(conn, "show.json", activity: activity)
    end
  end
end
