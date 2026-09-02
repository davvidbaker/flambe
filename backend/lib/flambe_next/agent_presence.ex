defmodule FlambeNext.AgentPresence do
  @moduledoc "Tracks recently successful bearer-token agent requests in memory."

  use GenServer

  @freshness_ms :timer.seconds(30)

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  def record(user_id, token_id) do
    ensure_started()
    GenServer.cast(__MODULE__, {:record, user_id, token_id, System.monotonic_time(:millisecond)})
  end

  def count(user_id) do
    ensure_started()
    GenServer.call(__MODULE__, {:count, user_id, System.monotonic_time(:millisecond)})
  end

  defp ensure_started do
    case Process.whereis(__MODULE__) do
      nil ->
        case GenServer.start(__MODULE__, %{}, name: __MODULE__) do
          {:ok, _pid} -> :ok
          {:error, {:already_started, _pid}} -> :ok
        end

      _pid ->
        :ok
    end
  end

  @impl true
  def init(presences), do: {:ok, presences}

  @impl true
  def handle_cast({:record, user_id, token_id, now}, presences) do
    {:noreply, Map.put(presences, {user_id, token_id}, now)}
  end

  @impl true
  def handle_call({:count, user_id, now}, _from, presences) do
    fresh_presences =
      Map.filter(presences, fn {_key, seen_at} -> now - seen_at <= @freshness_ms end)

    count =
      fresh_presences
      |> Map.keys()
      |> Enum.count(fn {presence_user_id, _token_id} -> presence_user_id == user_id end)

    {:reply, count, fresh_presences}
  end
end
