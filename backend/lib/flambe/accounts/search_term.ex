defmodule Flambe.Accounts.SearchTerm do
  use Ecto.Schema
  import Ecto.Changeset
  alias Flambe.Accounts.{User}
  alias Flambe.Utilities

  schema "search_terms" do
    field(:term, :string)
    field(:timestamp, :utc_datetime)
    field(:timestamp_integer, :integer, virtual: true)
    belongs_to(:user, User)

    timestamps()
  end

  @doc false
  def changeset(search_term, attrs) do
    search_term
    |> cast(attrs, [:term, :timestamp_integer])
    |> validate_required([:term, :timestamp_integer])
    |> Utilities.convert_timestamp_integer_to_datetime()
  end
end
