defmodule FlambeNext.AgentsTest do
  use FlambeNext.DataCase, async: true

  alias FlambeNext.{Accounts, Agents}

  setup do
    {:ok, user} =
      Accounts.create_user(%{
        name: "Agents User",
        username: "agents-user-#{System.unique_integer([:positive])}"
      })

    %{user: user}
  end

  test "coins a name for an unknown agent once and keeps it", %{user: user} do
    assert {:ok, %{agent: first, assigned?: true}} = Agents.identify(user, "cursor:conv-1", nil)
    assert first.name_source == "assigned"

    assert {:ok, %{agent: again, assigned?: false}} = Agents.identify(user, "cursor:conv-1", nil)
    assert again.name == first.name
    assert again.id == first.id
  end

  test "keeps a provided name and stores it", %{user: user} do
    assert {:ok, %{agent: agent, assigned?: false}} =
             Agents.identify(user, "cursor:conv-1", "  Grok ")

    assert agent.name == "Grok"
    assert agent.name_source == "provided"

    assert {:ok, %{agent: renamed, assigned?: false}} =
             Agents.identify(user, "cursor:conv-1", "Grok 2")

    assert renamed.name == "Grok 2"
  end

  test "ignores unusable provided names", %{user: user} do
    assert {:ok, %{agent: agent, assigned?: true}} =
             Agents.identify(user, "cursor:conv-1", "bad\nname")

    refute agent.name == "bad\nname"
    assert {:ok, %{agent: same, assigned?: false}} = Agents.identify(user, "cursor:conv-1", "   ")
    assert same.name == agent.name
  end

  test "never gives two agents of one user the same assigned name", %{user: user} do
    names =
      for n <- 1..60 do
        {:ok, %{agent: agent}} = Agents.identify(user, "agent-#{n}", nil)
        agent.name
      end

    assert length(Enum.uniq(names)) == 60
  end

  test "assigned names are per user", %{user: user} do
    {:ok, other} =
      Accounts.create_user(%{
        name: "Other",
        username: "agents-other-#{System.unique_integer([:positive])}"
      })

    {:ok, %{agent: a}} = Agents.identify(user, "shared-id", nil)
    {:ok, %{agent: b}} = Agents.identify(other, "shared-id", nil)
    assert a.name == b.name
    assert a.id != b.id
  end

  test "pick_name is deterministic for an id and avoids taken names" do
    assert Agents.pick_name("x", []) == Agents.pick_name("x", [])
    first = Agents.pick_name("x", [])
    refute Agents.pick_name("x", [first]) == first
    assert Agents.pick_name("x", [String.downcase(first)]) != first
  end
end
