defmodule FlambeWeb.ApiContractTest do
  use FlambeWeb.ConnCase

  alias Flambe.{TestHelper, Traces}
  alias FlambeWeb.{ThreadView, TraceView}

  test "thread show response preserves its JSON contract" do
    user = TestHelper.user_fixture()
    {:ok, trace} = Traces.create_trace(user, %{name: "Contract trace"})
    {:ok, thread} = Traces.create_thread(trace, %{name: "Regression thread", rank: 1})

    assert normalized(ThreadView.render("show.json", %{thread: thread})) ==
             fixture("thread_show.json")
  end

  test "trace show response preserves its JSON contract" do
    user = TestHelper.user_fixture()
    {:ok, trace} = Traces.create_trace(user, %{name: "Contract trace"})
    {:ok, _thread} = Traces.create_thread(trace, %{name: "Regression thread", rank: 1})

    rendered =
      TraceView.render("show.json", %{
        events: [],
        trace: Traces.get_trace!(trace.id)
      })

    assert normalized(rendered) == fixture("trace_show.json")
  end

  defp fixture(name) do
    __DIR__
    |> Path.join("../../fixtures/api_contracts/#{name}")
    |> File.read!()
    |> Poison.decode!()
  end

  defp normalized(response) do
    response
    |> Poison.encode!()
    |> Poison.decode!()
    |> normalize_ids()
  end

  defp normalize_ids(value) when is_list(value), do: Enum.map(value, &normalize_ids/1)

  defp normalize_ids(value) when is_map(value) do
    value
    |> Enum.map(fn
      {"id", id} when is_integer(id) -> {"id", "<integer>"}
      {key, item} -> {key, normalize_ids(item)}
    end)
    |> Map.new()
  end

  defp normalize_ids(value), do: value
end
