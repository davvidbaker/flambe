defmodule FlambeNextWeb.UserControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, Traces}

  test "returns the legacy dashboard shape for the signed-in user", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Dashboard User", username: "dashboard-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Dashboard trace"})

    {:ok, category} =
      Accounts.create_category(user, [], %{"name" => "Work", "color_background" => "#123456"})

    conn = conn |> authenticated_as(user) |> get(~p"/api/users/#{user}")

    assert json_response(conn, 200) == %{
             "data" => %{
               "attentionShifts" => [],
               "categories" => [
                 %{
                   "color_background" => "#123456",
                   "color_text" => nil,
                   "id" => category.id,
                   "name" => "Work"
                 }
               ],
               "id" => user.id,
               "mantras" => [],
               "observations" => [],
               "name" => "Dashboard User",
               "searchTerms" => [],
               "tabs" => [],
               "todos" => [],
               "traces" => [%{"id" => trace.id, "name" => "Dashboard trace"}],
               "username" => "dashboard-user"
             }
           }
  end

  test "dashboard show seeds default categories when the user has none", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Empty Palette", username: "empty-palette"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Existing trace"})

    conn = conn |> authenticated_as(user) |> get(~p"/api/users/#{user}")

    names =
      json_response(conn, 200)["data"]["categories"]
      |> Enum.map(& &1["name"])

    assert names == ["coding", "investigation", "review", "operations", "failure"]
    assert json_response(conn, 200)["data"]["traces"] == [
             %{"id" => trace.id, "name" => "Existing trace"}
           ]
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
