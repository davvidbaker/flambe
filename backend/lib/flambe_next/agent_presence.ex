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

  def subscribe(user_id) do
    Phoenix.PubSub.subscribe(FlambeNext.PubSub, topic(user_id))
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
    old_count = count_presences(presences, user_id, now)
    updated_presences = Map.put(presences, {user_id, token_id}, now)
    new_count = count_presences(updated_presences, user_id, now)

    if old_count != new_count, do: broadcast_count(user_id, new_count)

    Process.send_after(self(), {:expire, user_id, token_id, now}, @freshness_ms)
    {:noreply, updated_presences}
  end

  @impl true
  def handle_call({:count, user_id, now}, _from, presences) do
    fresh_presences =
      Map.filter(presences, fn {_key, seen_at} -> now - seen_at <= @freshness_ms end)

    {:reply, count_presences(fresh_presences, user_id, now), fresh_presences}
  end

  @impl true
  def handle_info({:expire, user_id, token_id, seen_at}, presences) do
    case Map.get(presences, {user_id, token_id}) do
      ^seen_at ->
        updated_presences = Map.delete(presences, {user_id, token_id})

        broadcast_count(
          user_id,
          count_presences(updated_presences, user_id, seen_at + @freshness_ms)
        )

        {:noreply, updated_presences}

      _ ->
        {:noreply, presences}
    end
  end

  defp count_presences(presences, user_id, now) do
    presences
    |> Enum.count(fn {{presence_user_id, _token_id}, seen_at} ->
      presence_user_id == user_id and now - seen_at <= @freshness_ms
    end)
  end

  defp broadcast_count(user_id, count) do
    Phoenix.PubSub.broadcast(FlambeNext.PubSub, topic(user_id), {:agent_presence, user_id, count})
  end

  defp topic(user_id), do: "agent_presence:#{user_id}"
end
