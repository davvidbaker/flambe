defmodule FlambeNext.SharesTest do
  use ExUnit.Case, async: true

  alias FlambeNext.Shares

  test "rejects an invalid snapshot" do
    assert Shares.create(%{"version" => 2}) == {:error, :invalid_snapshot}
    assert Shares.create(%{"version" => 1}) == {:error, :invalid_snapshot}
  end
end
