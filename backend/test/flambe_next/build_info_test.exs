defmodule FlambeNext.BuildInfoTest do
  use ExUnit.Case, async: false

  test "detect_git_sha prefers GIT_SHA when set" do
    previous = System.get_env("GIT_SHA")
    System.put_env("GIT_SHA", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

    try do
      assert FlambeNext.BuildInfo.detect_git_sha() ==
               "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    after
      if previous, do: System.put_env("GIT_SHA", previous), else: System.delete_env("GIT_SHA")
    end
  end
end
