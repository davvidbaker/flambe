defmodule FlambeNext.ReleaseApplicationsTest do
  use ExUnit.Case, async: true

  test "includes inets so Mix releases can start httpc for the reducer" do
    assert :inets in Application.spec(:flambe_next, :applications)
  end
end
