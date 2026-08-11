defmodule FlambeNextWeb.ThreadJSON do
  alias FlambeNext.Traces.Thread

  def show(%{thread: %Thread{} = thread}) do
    %{data: data(thread)}
  end

  defp data(thread), do: %{id: thread.id, name: thread.name, rank: thread.rank}
end
