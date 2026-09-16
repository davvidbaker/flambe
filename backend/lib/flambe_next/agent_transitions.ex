defmodule FlambeNext.AgentTransitions do
  @moduledoc """
  Pure lifecycle rules for agent-owned activities.

  These rules apply to the shared agent command interface. Browser edits retain their
  existing behavior.
  """

  @running_phases ~w(B R X)

  def status(phase) when phase in @running_phases, do: "running"
  def status("S"), do: "suspended"
  def status(phase) when phase in ~w(E J V), do: "ended"
  def status(_phase), do: "other"

  def available_actions(phase, open_descendants \\ []) do
    end_action =
      if open_descendants == [] do
        %{operation: "end"}
      else
        %{
          operation: "end",
          requires: %{force: true},
          reason: "open_descendants"
        }
      end

    case status(phase) do
      "running" -> [%{operation: "suspend"}, end_action]
      "suspended" -> [%{operation: "resume"}, end_action]
      _ -> []
    end
  end
end
