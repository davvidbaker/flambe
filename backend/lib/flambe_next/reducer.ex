defmodule FlambeNext.Reducer do
  @moduledoc """
  Deterministic reduction of worker lifecycle events (ADR-011).

  Workers propose transitions; this module folds them into the stack without a model,
  so it keeps working when `OPENAI_API_KEY` is absent. It reinterprets, it never drops:
  a proposed event is always recorded, and the stack invariants are restored around it.

  Current rule: ending an activity also ends any descendant that is still open
  (latest phase `B` or `R`), deepest first, at the same timestamp.
  """

  import Ecto.Query

  alias FlambeNext.Repo
  alias FlambeNext.Traces
  alias FlambeNext.Traces.{Activity, Event, Trace}

  @open_phases ~w(B R)

  @type closed :: %{activity: Activity.t(), event: Event.t()}
  @type result :: %{event: Event.t(), closed_descendants: [closed()]}

  @doc """
  Records `attrs` for `activity`, plus whatever the stack invariants require.

  Returns the proposed event and the descendants the reducer closed, in write order.
  """
  @spec reduce_event(Trace.t(), Activity.t(), map()) ::
          {:ok, result()} | {:error, Ecto.Changeset.t()}
  def reduce_event(%Trace{} = trace, %Activity{} = activity, attrs) when is_map(attrs) do
    case phase(attrs) do
      "E" -> end_with_descendants(trace, activity, attrs)
      _ -> plain(trace, activity, attrs)
    end
  end

  @doc """
  Activities below `activity` whose latest event is still open, deepest first.
  """
  @spec open_descendants(Trace.t(), Activity.t()) :: [Activity.t()]
  def open_descendants(%Trace{id: trace_id}, %Activity{id: root_id}) do
    activities =
      from(a in Activity,
        join: thread in assoc(a, :thread),
        where: thread.trace_id == ^trace_id,
        select: {a.id, a.parent_id}
      )
      |> Repo.all()

    children =
      Enum.group_by(activities, fn {_id, parent_id} -> parent_id end, fn {id, _} -> id end)

    descendants = collect_descendants(children, [root_id], %{}, 1)

    if descendants == %{} do
      []
    else
      ids = Map.keys(descendants)

      open_ids =
        from(e in Event,
          where: e.activity_id in ^ids,
          distinct: e.activity_id,
          order_by: [asc: e.activity_id, desc: e.timestamp, desc: e.id],
          select: {e.activity_id, e.phase}
        )
        |> Repo.all()
        |> Enum.filter(fn {_id, phase} -> phase in @open_phases end)
        |> Enum.map(fn {id, _} -> id end)

      from(a in Activity, where: a.id in ^open_ids)
      |> Repo.all()
      |> Enum.sort_by(fn a -> {-Map.fetch!(descendants, a.id), -a.id} end)
    end
  end

  defp collect_descendants(_children, [], acc, _depth), do: acc

  defp collect_descendants(children, ids, acc, depth) do
    next =
      ids
      |> Enum.flat_map(&Map.get(children, &1, []))
      |> Enum.reject(&Map.has_key?(acc, &1))

    acc = Enum.reduce(next, acc, &Map.put(&2, &1, depth))
    collect_descendants(children, next, acc, depth + 1)
  end

  defp plain(trace, activity, attrs) do
    with {:ok, event} <- Traces.create_event(trace, activity, attrs) do
      {:ok, %{event: event, closed_descendants: []}}
    end
  end

  defp end_with_descendants(trace, activity, attrs) do
    open = open_descendants(trace, activity)

    Repo.transaction(fn ->
      closed =
        Enum.map(open, fn descendant ->
          descendant_attrs = %{
            "phase" => "E",
            "message" =>
              "Ended by reducer: parent activity #{activity.id} (#{activity.name}) ended",
            "timestamp_integer" => timestamp_integer(attrs)
          }

          case Traces.create_event(trace, descendant, descendant_attrs) do
            {:ok, event} -> %{activity: descendant, event: event}
            {:error, changeset} -> Repo.rollback(changeset)
          end
        end)

      case Traces.create_event(trace, activity, attrs) do
        {:ok, event} -> %{event: event, closed_descendants: closed}
        {:error, changeset} -> Repo.rollback(changeset)
      end
    end)
  end

  defp phase(attrs), do: Map.get(attrs, "phase") || Map.get(attrs, :phase)

  defp timestamp_integer(attrs) do
    case Map.get(attrs, "timestamp_integer") || Map.get(attrs, :timestamp_integer) do
      value when is_integer(value) -> value
      _ -> System.system_time(:millisecond)
    end
  end
end
