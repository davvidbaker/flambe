defmodule FlambeNext.AccountsTest do
  use FlambeNext.DataCase, async: true

  alias FlambeNext.Accounts

  @default_names [
    "bug fixing",
    "research",
    "cleaning",
    "bug hunting",
    "design",
    "writing tests",
    "toil",
    "analytics",
    "oss",
    "enhancements",
    "refactoring components",
    "Fundamentals",
    "jarring ui",
    "writing",
    "risky",
    "dependency upgrades",
    "shiny",
    "performance",
    "learning"
  ]

  test "ensure_default_categories seeds the local-database palette when the user has none" do
    {:ok, user} =
      Accounts.create_user(%{
        name: "Palette User",
        username: "palette-user-#{System.unique_integer([:positive])}"
      })

    categories = Accounts.ensure_default_categories(user)

    assert Enum.map(categories, & &1.name) == @default_names

    assert Enum.map(categories, & &1.color_background) ==
             Enum.map(Accounts.default_categories(), & &1["color_background"])

    assert Accounts.ensure_default_categories(user) == categories
  end

  test "ensure_default_categories keeps custom categories and fills missing defaults" do
    {:ok, user} =
      Accounts.create_user(%{
        name: "Custom User",
        username: "custom-user-#{System.unique_integer([:positive])}"
      })

    {:ok, work} =
      Accounts.create_category(user, [], %{"name" => "Work", "color_background" => "#123456"})

    names = Enum.map(Accounts.ensure_default_categories(user), & &1.name)

    assert hd(names) == "Work"
    assert Enum.map(Accounts.list_user_categories(user), & &1.id) |> hd() == work.id
    assert @default_names -- names == []
    assert "Work" in names
  end

  test "update_user_settings merges allowed keys" do
    {:ok, user} =
      Accounts.create_user(%{
        name: "Settings User",
        username: "settings-user-#{System.unique_integer([:positive])}"
      })

    {:ok, user} =
      Accounts.update_user_settings(user, %{
        "settings" => %{"rightAlignTimelineText" => true, "ignored" => true}
      })

    assert user.settings == %{"rightAlignTimelineText" => true}

    {:ok, user} =
      Accounts.update_user_settings(user, %{"settings" => %{"rightAlignTimelineText" => false}})

    assert user.settings == %{"rightAlignTimelineText" => false}
  end
end
