defmodule FlambeNextWeb.TraceJSONTest do
  use FlambeNext.DataCase, async: true

  alias FlambeNext.{Accounts, Traces}
  alias FlambeNextWeb.TraceJSON

  test "preserves the legacy trace show JSON contract for an empty trace" do
    {:ok, user} = Accounts.create_user(%{name: "Contract User", username: "contract-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Contract trace"})
    {:ok, _thread} = Traces.create_thread(trace, %{name: "Regression thread", rank: 1})

    trace = Traces.get_trace!(trace.id)

    assert normalized(TraceJSON.show(%{trace: trace})) == fixture("trace_show.json")
  end

  defp fixture(name) do
    __DIR__
    |> Path.join("../../fixtures/api_contracts/#{name}")
    |> File.read!()
    |> Jason.decode!()
  end

  defp normalized(response) do
    response
    |> Jason.encode!()
    |> Jason.decode!()
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
