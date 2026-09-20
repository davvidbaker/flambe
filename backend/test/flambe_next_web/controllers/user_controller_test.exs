defmodule FlambeNextWeb.UserControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, Traces}

  test "returns the legacy dashboard shape for the signed-in user", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Dashboard User", username: "dashboard-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Dashboard trace"})

    {:ok, category} =
      Accounts.create_category(user, [], %{"name" => "Work", "color_background" => "#123456"})

    conn = conn |> authenticated_as(user) |> get(~p"/api/users/#{user}")

    payload = json_response(conn, 200)["data"]

    assert payload["id"] == user.id
    assert payload["name"] == "Dashboard User"
    assert payload["username"] == "dashboard-user"
    assert payload["traces"] == [%{"id" => trace.id, "name" => "Dashboard trace"}]
    assert payload["settings"] == %{}
    assert payload["observations"] == []

    assert %{
             "color_background" => "#123456",
             "color_text" => nil,
             "id" => category.id,
             "name" => "Work"
           } in payload["categories"]

    default_names = Enum.map(Accounts.default_categories(), & &1["name"])
    assert default_names -- Enum.map(payload["categories"], & &1["name"]) == []
    assert payload["agents"] == []
  end

  test "dashboard show seeds default categories when the user has none", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Empty Palette", username: "empty-palette"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Existing trace"})

    conn = conn |> authenticated_as(user) |> get(~p"/api/users/#{user}")

    names =
      json_response(conn, 200)["data"]["categories"]
      |> Enum.map(& &1["name"])

    assert names == Enum.map(Accounts.default_categories(), & &1["name"])

    assert json_response(conn, 200)["data"]["traces"] == [
             %{"id" => trace.id, "name" => "Existing trace"}
           ]
  end

  test "dashboard show includes the user's named agents", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Agent Owner", username: "agent-owner"})

    {:ok, %{agent: agent}} =
      FlambeNext.Agents.identify(user, "cursor:theo", "Theo", "Cursor Cloud")

    conn = conn |> authenticated_as(user) |> get(~p"/api/users/#{user}")

    assert %{
             "agent_id" => "cursor:theo",
             "name" => "Theo",
             "platform" => "Cursor Cloud"
           } in json_response(conn, 200)["data"]["agents"]

    assert agent.name == "Theo"
  end

  test "updates persisted user settings for the signed-in user", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Settings User", username: "settings-user"})

    conn =
      conn
      |> authenticated_as(user)
      |> put(~p"/api/users/#{user}", %{
        "user" => %{"settings" => %{"rightAlignTimelineText" => true}}
      })

    assert json_response(conn, 200)["data"]["settings"] == %{
             "rightAlignTimelineText" => true
           }

    conn = conn |> recycle() |> authenticated_as(user) |> get(~p"/api/users/#{user}")
    assert json_response(conn, 200)["data"]["settings"]["rightAlignTimelineText"] == true
  end

  test "rejects non-boolean user settings", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Bad Settings", username: "bad-settings"})

    conn =
      conn
      |> authenticated_as(user)
      |> put(~p"/api/users/#{user}", %{
        "user" => %{"settings" => %{"rightAlignTimelineText" => "yes"}}
      })

    assert json_response(conn, 422)["errors"]["settings"] == [
             "rightAlignTimelineText must be a boolean"
           ]
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
