defmodule FlambeNext.AccountsTest do
  use FlambeNext.DataCase, async: true

  alias FlambeNext.Accounts

  test "ensure_default_categories seeds the chart vocabulary when the user has none" do
    {:ok, user} =
      Accounts.create_user(%{
        name: "Palette User",
        username: "palette-user-#{System.unique_integer([:positive])}"
      })

    categories = Accounts.ensure_default_categories(user)

    assert Enum.map(categories, & &1.name) == [
             "coding",
             "investigation",
             "review",
             "operations",
             "failure"
           ]

    assert Enum.map(categories, & &1.color_background) == [
             "#efc360",
             "#60a5fa",
             "#a78bfa",
             "#34d399",
             "#fb7185"
           ]

    assert Accounts.ensure_default_categories(user) == categories
  end

  test "ensure_default_categories leaves an existing palette alone" do
    {:ok, user} =
      Accounts.create_user(%{
        name: "Custom User",
        username: "custom-user-#{System.unique_integer([:positive])}"
      })

    {:ok, work} =
      Accounts.create_category(user, [], %{"name" => "Work", "color_background" => "#123456"})

    assert Enum.map(Accounts.ensure_default_categories(user), & &1.id) == [work.id]
    assert Enum.map(Accounts.list_user_categories(user), & &1.name) == ["Work"]
  end
end
