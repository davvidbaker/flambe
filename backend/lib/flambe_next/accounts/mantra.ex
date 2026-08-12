defmodule FlambeNext.Accounts.Mantra do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Accounts.User

  schema "mantras" do
    field :name, :string
    field :timestamp, :utc_datetime_usec
    field :timestamp_integer, :integer, virtual: true

    belongs_to :user, User

    timestamps(type: :utc_datetime)
  end

  def changeset(mantra, attrs) do
    mantra
    |> cast(attrs, [:name, :timestamp, :timestamp_integer])
    |> validate_required([:name])
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
