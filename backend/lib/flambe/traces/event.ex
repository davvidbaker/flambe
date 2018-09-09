defmodule Flambe.Traces.Event do
  use Ecto.Schema
  import Ecto.Changeset
  alias Flambe.Traces.{Event, Trace, Activity}
  alias Flambe.Utilities

  schema "events" do
    field(:message, :string)
    field(:phase, :string)
    field(:timestamp, :utc_datetime)
    field(:timestamp_integer, :integer, virtual: true)
    belongs_to(:trace, Trace)
    belongs_to(:activity, Activity)

    timestamps()
  end

  @doc false
  def changeset(%Event{} = event, attrs) do
    # ⚠️ phase might not be the best descriptor
    event
    |> cast(attrs, [:timestamp_integer, :phase, :message])
    |> validate_required([:timestamp_integer, :phase])
    |> Utilities.convert_timestamp_integer_to_datetime()
  end
end
