defmodule FlambeNext.Accounts.SearchTerm do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Accounts.User

  schema "search_terms" do
    field :term, :string
    field :timestamp, :utc_datetime_usec
    field :timestamp_integer, :integer, virtual: true

    belongs_to :user, User

    timestamps(type: :utc_datetime)
  end

  def changeset(search_term, attrs) do
    search_term
    |> cast(attrs, [:term, :timestamp, :timestamp_integer])
    |> validate_required([:term])
    |> put_timestamp_from_integer()
    |> validate_required([:timestamp])
    |> assoc_constraint(:user)
  end

  defp put_timestamp_from_integer(changeset) do
    case get_change(changeset, :timestamp_integer) do
      nil ->
        changeset

      timestamp ->
        case DateTime.from_unix(timestamp * 1_000, :microsecond) do
          {:ok, datetime} ->
            put_change(changeset, :timestamp, datetime)

          {:error, _reason} ->
            add_error(changeset, :timestamp_integer, "must be a valid Unix timestamp")
        end
    end
  end
end
