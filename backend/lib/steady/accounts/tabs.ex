defmodule Flambe.Accounts.Tabs do
  use Ecto.Schema
  import Ecto.Changeset
  alias Flambe.Accounts.{User}
  alias Flambe.Utilities

  schema "tabs" do
    field(:count, :integer)
    field(:window_count, :integer)
    field(:timestamp, :utc_datetime)
    field(:timestamp_integer, :integer, virtual: true)
    belongs_to(:user, User)

    timestamps()
  end

  @doc false
  def changeset(tabs, attrs) do
    tabs
    |> cast(attrs, [:timestamp_integer, :count, :window_count])
    |> validate_required([:count, :timestamp_integer])
    |> Utilities.convert_timestamp_integer_to_datetime()
  end
end
