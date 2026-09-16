defmodule FlambeNext.Reducer.ReviewContextTest do
  use FlambeNext.DataCase, async: true

  alias FlambeNext.{Accounts, Traces}
  alias FlambeNext.Reducer.Review

  @day_ms 24 * 60 * 60 * 1000
  @on_track Jason.encode!(%{
              "assessment" => "on_track",
              "direction" => nil,
              "reply" => nil,
              "rationale" => "ok",
              "actions" => [%{"type" => "no_op"}]
            })

  test "message context keeps the live stack and recent closed work, not old closed subtrees" do
    suffix = System.unique_integer([:positive])
    {:ok, user} = Accounts.create_user(%{name: "Review", username: "review-#{suffix}"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Long flame"})
    thread = hd(Traces.get_trace!(trace.id).threads)

    now = System.system_time(:millisecond)
    old = now - 40 * @day_ms
    recent = now - 2 * @day_ms

    {:ok, intent, _} = begin(trace, thread, nil, "Intent root", old)
    {:ok, old_closed, _} = begin(trace, thread, nil, "Old closed root", old)
    {:ok, _} = close(trace, old_closed, old + 1)
    {:ok, recent_closed, _} = begin(trace, thread, nil, "Recent closed root", recent)
    {:ok, _} = close(trace, recent_closed, recent + 1)
    {:ok, suspended, _} = begin(trace, thread, nil, "Old suspended root", old)

    {:ok, _} =
      Traces.create_event(trace, suspended, %{
        "phase" => "S",
        "timestamp_integer" => old + 1
      })

    {:ok, old_child, _} = begin(trace, thread, intent, "Old closed child", old)
    {:ok, _} = close(trace, old_child, old + 1)
    {:ok, current, _} = begin(trace, thread, intent, "Current leaf", recent)

    context = flame_context(message_prompt(user, trace.id, current.id))
    names = MapSet.new(Enum.map(context["stack"], & &1["name"]))

    assert names ==
             MapSet.new([
               "Intent root",
               "Recent closed root",
               "Old suspended root",
               "Current leaf"
             ])

    refute Map.has_key?(context, "children")
    refute Map.has_key?(context, "siblings")
    refute Map.has_key?(context["current"], "description")
    assert hd(context["ancestors"])["name"] == "Intent root"
  end

  defp begin(trace, thread, parent, name, timestamp) do
    Traces.create_activity(trace, thread, parent, %{name: name}, %{
      "phase" => "B",
      "timestamp_integer" => timestamp
    })
  end

  defp close(trace, activity, timestamp) do
    Traces.create_event(trace, activity, %{
      "phase" => "E",
      "timestamp_integer" => timestamp
    })
  end

  defp message_prompt(user, trace_id, activity_id) do
    test_pid = self()

    assert {:ok, _} =
             Review.handle(
               user,
               %{
                 "trace_id" => trace_id,
                 "activity_id" => activity_id,
                 "message" => "Still on the leaf.",
                 "agent_id" => "review-agent"
               },
               llm: fn _model, prompt ->
                 send(test_pid, {:prompt, prompt})
                 {:ok, @on_track}
               end
             )

    assert_receive {:prompt, prompt}
    prompt
  end

  defp flame_context(prompt) do
    assert [_, json] = Regex.run(~r/Current flame context:\n(\{.*\})\n\nSender/s, prompt)
    Jason.decode!(json)
  end
end
