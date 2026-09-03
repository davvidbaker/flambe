defmodule FlambeNext.AgentsTest do
  use ExUnit.Case, async: true

  alias FlambeNext.Agents

  test "prefers a usable provided name, then the token name, then a roster name" do
    assert Agents.display_name("cursor:conv-1", "  Grok  ", "Claude") == "Grok"
    assert Agents.display_name("cursor:conv-1", "   ", "Claude") == "Claude"
    assert Agents.display_name("cursor:conv-1", nil, nil) == Agents.name_for("cursor:conv-1")

    assert Agents.display_name("cursor:conv-1", "bad\nname", nil) ==
             Agents.name_for("cursor:conv-1")
  end

  test "assigns a stable roster name for an instance id" do
    assert Agents.name_for("cursor:conv-1") == Agents.name_for("cursor:conv-1")

    assert Agents.name_for("cursor:conv-1") in ~w(Steve Belinda Juniper Marcel Priya Otis Nia Theo Carmen Felix Imani Rory Greta Miles Suki)
  end
end
