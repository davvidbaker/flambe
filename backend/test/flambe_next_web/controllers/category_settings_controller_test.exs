defmodule FlambeNextWeb.CategorySettingsControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.Accounts

  test "redirects unauthenticated browsers to the spa", %{conn: conn} do
    conn = get(conn, ~p"/settings/categories")
    assert redirected_to(conn) == "/"
  end

  test "lists categories and includes a csrf token", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "HTML Cats", username: "html-cats"})

    conn = conn |> authenticated_as(user) |> get(~p"/settings/categories")
    html = html_response(conn, 200)

    assert html =~ "Categories"
    assert html =~ ~s(name="_csrf_token")
    assert html =~ hd(Accounts.default_categories())["name"]
    assert html =~ ~s(aria-label="Category name")
    refute html =~ ~r/<label>\s*Name\s*<input/
    toil = Enum.find(Accounts.default_categories(), &(&1["name"] == "toil"))
    assert html =~ "background-color: #{toil["color_background"]}"
    assert html =~ "color: #{toil["color_text"]}"
  end

  test "creates a category from the html form", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "HTML Create", username: "html-create"})
    conn = conn |> authenticated_as(user) |> get(~p"/settings/categories")
    token = csrf_token(html_response(conn, 200))

    conn =
      conn
      |> recycle()
      |> post(~p"/settings/categories", %{
        "_csrf_token" => token,
        "category" => %{
          "name" => "window-ops",
          "color_background" => "#123456",
          "color_text" => "#ffffff"
        }
      })

    assert redirected_to(conn) == ~p"/settings/categories"
    names = Accounts.list_user_categories(user) |> Enum.map(& &1.name)
    assert "window-ops" in names
  end

  test "updates and deletes a category from the html form", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "HTML Update", username: "html-update"})

    {:ok, category} =
      Accounts.create_category(user, [], %{
        "name" => "scratch",
        "color_background" => "#111111",
        "color_text" => "#eeeeee"
      })

    conn = conn |> authenticated_as(user) |> get(~p"/settings/categories")
    token = csrf_token(html_response(conn, 200))

    conn =
      conn
      |> recycle()
      |> put(~p"/settings/categories/#{category}", %{
        "_csrf_token" => token,
        "category" => %{
          "name" => "scratch-renamed",
          "color_background" => "#222222",
          "color_text" => "#ffffff"
        }
      })

    assert redirected_to(conn) == ~p"/settings/categories"
    assert Accounts.get_user_category!(user, category.id).name == "scratch-renamed"

    conn = conn |> recycle() |> get(~p"/settings/categories")
    token = csrf_token(html_response(conn, 200))

    conn =
      conn
      |> recycle()
      |> delete(~p"/settings/categories/#{category}", %{
        "_csrf_token" => token
      })

    assert redirected_to(conn) == ~p"/settings/categories"
    refute Enum.any?(Accounts.list_user_categories(user), &(&1.id == category.id))
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end

  defp csrf_token(html) do
    regexes = [
      ~r/name="_csrf_token"[^>]*value="([^"]+)"/,
      ~r/value="([^"]+)"[^>]*name="_csrf_token"/
    ]

    Enum.find_value(regexes, fn regex ->
      case Regex.run(regex, html) do
        [_, token] -> token
        _ -> nil
      end
    end) || flunk("csrf token missing")
  end
end
