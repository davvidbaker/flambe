defmodule FlambeNext.Traces.Event do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Traces.{Activity, Trace}

  schema "events" do
    field :timestamp, :utc_datetime_usec
    field :phase, :string
    field :message, :string

    belongs_to :trace, Trace
    belongs_to :activity, Activity

    timestamps(type: :utc_datetime)
  end

  def changeset(event, attrs) do
    event
    |> cast(attrs, [:phase, :message])
    |> validate_required([:phase])
    |> put_timestamp(attrs)
    |> validate_required([:timestamp])
    |> assoc_constraint(:trace)
    |> assoc_constraint(:activity)
  end

  defp put_timestamp(changeset, attrs) do
    case Map.get(attrs, "timestamp_integer") || Map.get(attrs, :timestamp_integer) do
      timestamp when is_integer(timestamp) ->
        case DateTime.from_unix(timestamp, :millisecond) do
          {:ok, datetime} ->
            put_change(changeset, :timestamp, DateTime.add(datetime, 0, :microsecond))

          {:error, _reason} ->
            add_error(changeset, :timestamp_integer, "is invalid")
        end

      _ ->
        changeset
    end
  end
end
