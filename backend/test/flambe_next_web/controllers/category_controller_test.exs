defmodule FlambeNextWeb.CategoryControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, Traces}

  test "creates an owned category, associates it with an activity, and renders it in the trace",
       %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Category User", username: "category-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Category trace"})
    thread = trace.id |> Traces.get_trace!() |> Map.fetch!(:threads) |> List.first()

    {:ok, activity, _event} =
      Traces.create_activity(
        trace,
        thread,
        %{"name" => "Categorized work"},
        %{"timestamp_integer" => 1_723_465_600_123, "phase" => "B"}
      )

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/categories", %{
        "user_id" => 123_456,
        "activity_ids" => [activity.id],
        "category" => %{
          "name" => "Work",
          "color_background" => "#ff0000",
          "color_text" => "#ffffff"
        }
      })

    assert %{
             "data" => %{
               "color_background" => "#ff0000",
               "color_text" => "#ffffff",
               "id" => category_id,
               "name" => "Work"
             }
           } = json_response(conn, 201)

    conn = conn |> recycle() |> get(~p"/api/traces/#{trace}")

    assert %{
             "data" => %{
               "events" => [%{"activity" => %{"categories" => [^category_id]}}]
             }
           } = json_response(conn, 200)
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
