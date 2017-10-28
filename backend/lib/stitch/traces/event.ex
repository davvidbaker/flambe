defmodule Stitch.Traces.Event do
  use Ecto.Schema
  import Ecto.Changeset
  alias Stitch.Traces.{Event, Trace, Activity}

  schema "events" do
    field :message, :string
    field :phase, :string
    field :timestamp, :utc_datetime
    field :timestamp_integer, :integer, virtual: true
    belongs_to :trace, Trace
    belongs_to :activity, Activity

    timestamps()
  end

  @doc false
  def changeset(%Event{} = event, attrs) do
    event
    |> cast(attrs, [:timestamp_integer, :phase, :message])
    |> validate_required([:timestamp_integer, :phase])
    |> convert_timestamp_integer_to_datetime
  end

  def convert_timestamp_integer_to_datetime(changeset) do
    timestamp_integer = get_field(changeset, :timestamp_integer)
    timestamp = Ecto.DateTime.from_unix!(timestamp_integer, 1000)
    put_change(changeset, :timestamp, timestamp)
  end


end
