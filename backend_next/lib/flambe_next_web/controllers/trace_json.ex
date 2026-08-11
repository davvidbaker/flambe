defmodule FlambeNextWeb.TraceJSON do
  alias FlambeNext.Traces.Trace

  def show(%{trace: %Trace{} = trace}) do
    %{data: data(trace)}
  end

  defp data(trace) do
    %{
      id: trace.id,
      name: trace.name,
      events: [],
      threads: Enum.map(trace.threads, &thread_data/1)
    }
  end

  defp thread_data(thread) do
    %{id: thread.id, name: thread.name, rank: thread.rank}
  end
end
