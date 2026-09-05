defmodule FlambeNext.Imports do
  @moduledoc false

  import Ecto.Query

  alias FlambeNext.Accounts
  alias FlambeNext.Accounts.{Category, User}
  alias FlambeNext.Repo
  alias FlambeNext.Traces
  alias FlambeNext.Traces.{Event, Thread, Trace}

  @format "flambe-local-export"
  @version 1

  def import_bundle(%User{} = user, payload) when is_map(payload) do
    with :ok <- validate(payload) do
      Repo.transaction(fn ->
        category_ids = upsert_categories(user, payload["categories"] || [])
        traces = Enum.map(payload["traces"] || [], &import_trace(user, &1, category_ids))
        observations = Enum.map(payload["observations"] || [], &import_observation(user, &1))
        %{traces: traces, observations: observations}
      end)
    end
  end

  def import_bundle(_user, _payload), do: {:error, :invalid_bundle}

  defp validate(%{"format" => @format, "version" => @version, "traces" => traces})
       when is_list(traces),
       do: :ok

  defp validate(_), do: {:error, :invalid_bundle}

  defp upsert_categories(user, categories) do
    existing =
      user
      |> Accounts.list_user_categories()
      |> Map.new(&{&1.name, &1})

    Map.new(categories, fn category ->
      export_id = category["export_id"]
      name = category["name"]

      record =
        case existing[name] do
          %Category{} = found ->
            found

          nil ->
            {:ok, created} =
              Accounts.create_category(user, [], %{
                "name" => name,
                "color_background" => category["color_background"] || "#efc360",
                "color_text" => category["color_text"] || "#000000"
              })

            created
        end

      {export_id, record}
    end)
  end

  defp import_trace(user, trace_payload, category_ids) do
    import_key = trace_payload["export_id"]

    case existing_trace(user, import_key) do
      %Trace{} = trace ->
        %{id: trace.id, name: trace.name, import_key: import_key, skipped: true}

      nil ->
        create_imported_trace(user, trace_payload, category_ids)
    end
  end

  defp existing_trace(_user, nil), do: nil

  defp existing_trace(user, import_key) do
    from(trace in Trace,
      where: trace.user_id == ^user.id and trace.import_key == ^import_key
    )
    |> Repo.one()
  end

  defp create_imported_trace(user, trace_payload, category_ids) do
    name = unique_trace_name(user, trace_payload["name"] || "Imported")

    {:ok, trace} =
      %Trace{user_id: user.id, import_key: trace_payload["export_id"]}
      |> Trace.changeset(%{name: name})
      |> Repo.insert()

    thread_ids =
      Map.new(trace_payload["threads"] || [], fn thread_payload ->
        {:ok, thread} =
          %Thread{trace_id: trace.id}
          |> Thread.changeset(%{
            "name" => thread_payload["name"] || "Main",
            "rank" => thread_payload["rank"] || 0
          })
          |> Repo.insert()

        {thread_payload["export_id"], thread}
      end)

    activity_ids =
      trace_payload["activities"]
      |> List.wrap()
      |> sort_activities()
      |> Enum.reduce(%{}, fn activity_payload, acc ->
        thread = Map.fetch!(thread_ids, activity_payload["thread_export_id"])
        parent = parent_activity(acc, activity_payload["parent_export_id"])

        categories =
          mapped_categories(category_ids, activity_payload["category_export_ids"] || [])

        {:ok, activity, _event} =
          Traces.create_activity(
            trace,
            thread,
            parent,
            activity_attrs(activity_payload),
            placeholder_begin(activity_payload),
            categories
          )

        # create_activity always writes a B event; drop it and use exported events.
        Repo.delete_all(from(event in Event, where: event.activity_id == ^activity.id))

        Map.put(acc, activity_payload["export_id"], activity)
      end)

    for event_payload <- List.wrap(trace_payload["events"]) do
      activity = Map.get(activity_ids, event_payload["activity_export_id"])

      if activity do
        {:ok, _event} =
          Traces.create_event(trace, activity, %{
            "phase" => event_payload["phase"],
            "message" => event_payload["message"],
            "timestamp_integer" => event_timestamp(event_payload)
          })
      end
    end

    %{id: trace.id, name: name, import_key: trace_payload["export_id"], skipped: false}
  end

  defp placeholder_begin(activity_payload) do
    %{
      "phase" => "B",
      "timestamp_integer" => event_timestamp(activity_payload)
    }
  end

  defp activity_attrs(payload) do
    %{
      "name" => payload["name"],
      "description" => payload["description"],
      "weight" => payload["weight"],
      "agent_id" => payload["agent_id"],
      "agent_name" => payload["agent_name"]
    }
  end

  defp parent_activity(_acc, nil), do: nil
  defp parent_activity(acc, export_id), do: Map.get(acc, export_id)

  defp mapped_categories(category_ids, export_ids) do
    Enum.flat_map(export_ids, fn export_id ->
      case Map.get(category_ids, export_id) do
        nil -> []
        category -> [category]
      end
    end)
  end

  defp sort_activities(activities) do
    by_id = Map.new(activities, &{&1["export_id"], &1})

    activities
    |> Enum.map(& &1["export_id"])
    |> Enum.reduce({[], MapSet.new()}, fn _id, {ordered, seen} ->
      insert_ready(by_id, ordered, seen)
    end)
    |> then(fn {ordered, _seen} ->
      remaining =
        Enum.reject(activities, fn activity -> activity["export_id"] in ordered_ids(ordered) end)

      ordered ++ remaining
    end)
  end

  defp ordered_ids(ordered), do: Enum.map(ordered, & &1["export_id"]) |> MapSet.new()

  defp insert_ready(by_id, ordered, seen) do
    ready =
      by_id
      |> Map.values()
      |> Enum.filter(fn activity ->
        export_id = activity["export_id"]
        parent = activity["parent_export_id"]

        not MapSet.member?(seen, export_id) and
          (parent in [nil, ""] or MapSet.member?(seen, parent))
      end)

    Enum.reduce(ready, {ordered, seen}, fn activity, {acc, seen_acc} ->
      {acc ++ [activity], MapSet.put(seen_acc, activity["export_id"])}
    end)
  end

  defp event_timestamp(%{"timestamp_integer" => ts}) when is_integer(ts), do: ts

  defp event_timestamp(%{"timestamp" => timestamp}) when is_binary(timestamp) do
    case DateTime.from_iso8601(timestamp) do
      {:ok, datetime, _offset} -> DateTime.to_unix(datetime, :millisecond)
      _ -> DateTime.to_unix(DateTime.utc_now(), :millisecond)
    end
  end

  defp event_timestamp(_), do: DateTime.to_unix(DateTime.utc_now(), :millisecond)

  defp unique_trace_name(user, desired) do
    names = user |> Traces.list_user_traces() |> Enum.map(& &1.name) |> MapSet.new()

    cond do
      desired not in names -> desired
      "#{desired} (imported)" not in names -> "#{desired} (imported)"
      true -> "#{desired} (imported #{String.slice(Ecto.UUID.generate(), 0, 8)})"
    end
  end

  defp import_observation(user, payload) do
    attrs = %{
      "kind" => payload["kind"],
      "value" => payload["value"],
      "unit" => payload["unit"],
      "payload" => payload["payload"] || %{},
      "observed_on" => payload["observed_on"],
      "timestamp_integer" => event_timestamp(payload)
    }

    case Accounts.upsert_observation(user, attrs) do
      {:ok, observation, action} -> %{id: observation.id, kind: observation.kind, action: action}
      {:error, _} -> %{error: "invalid_observation", kind: payload["kind"]}
    end
  end
end
