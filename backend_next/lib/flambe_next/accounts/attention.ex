defmodule FlambeNext.Accounts.Attention do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Accounts.User
  alias FlambeNext.Traces.Thread

  schema "attentions" do
    field :timestamp, :utc_datetime_usec
    field :timestamp_integer, :integer, virtual: true

    belongs_to :user, User
    belongs_to :thread, Thread

    timestamps(type: :utc_datetime)
  end

  def changeset(attention, attrs) do
    attention
    |> cast(attrs, [:thread_id, :timestamp, :timestamp_integer])
    |> validate_required([:thread_id])
    |> put_timestamp_from_integer()
    |> validate_required([:timestamp])
    |> assoc_constraint(:user)
    |> assoc_constraint(:thread)
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
