defmodule Stitch.Accounts.Mantra do
  use Ecto.Schema
  import Ecto.Changeset
  alias Stitch.Accounts.{User}
  alias Stitch.Utilities

  schema "mantras" do
    field :name, :string
    field :timestamp, :utc_datetime
    field :timestamp_integer, :integer, virtual: true
    belongs_to :user, User

    timestamps()
  end

  @doc false
  def changeset(mantra, attrs) do
    mantra
    |> cast(attrs, [:timestamp_integer, :name])
    |> validate_required([:timestamp_integer, :name])
    |> Utilities.convert_timestamp_integer_to_datetime
  end
end
