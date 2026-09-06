defmodule FlambeNext.ReducerAgentTest do
  use ExUnit.Case, async: true

  alias FlambeNext.ReducerAgent

  @mutation %{"type" => "create_child", "parent_activity_id" => 1, "name" => "Child"}

  test "keeps every proposed action when the worker allows stack changes" do
    assert ReducerAgent.restrict_actions([@mutation], true) == [@mutation]
  end

  test "drops stack mutations for workers that own their own stack" do
    assert ReducerAgent.restrict_actions([@mutation], false) == []
    assert ReducerAgent.restrict_actions([%{"type" => "no_op"}], false) == [%{"type" => "no_op"}]
  end
end
