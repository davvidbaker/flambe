defmodule FlambeNext.Accounts.Observation do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Accounts.User

  @kind_format ~r/^[a-z][a-z0-9_]{0,63}$/

  schema "observations" do
    field :kind, :string
    field :value, :float
    field :unit, :string
    field :payload, :map, default: %{}
    field :observed_on, :date
    field :timestamp, :utc_datetime_usec
    field :timestamp_integer, :integer, virtual: true

    belongs_to :user, User

    timestamps(type: :utc_datetime)
  end

  def changeset(observation, attrs) do
    observation
    |> cast(attrs, [:kind, :value, :unit, :payload, :observed_on, :timestamp, :timestamp_integer])
    |> update_change(:kind, &normalize_kind/1)
    |> put_timestamp_from_integer()
    |> validate_required([:kind, :value, :timestamp])
    |> validate_format(:kind, @kind_format,
      message: "must be a lowercase slug starting with a letter"
    )
    |> validate_length(:unit, max: 64)
    |> validate_payload()
    |> assoc_constraint(:user)
    |> unique_constraint([:user_id, :kind, :observed_on],
      name: :observations_user_kind_observed_on_index
    )
  end

  defp normalize_kind(kind) when is_binary(kind), do: String.downcase(String.trim(kind))
  defp normalize_kind(kind), do: kind

  defp validate_payload(changeset) do
    case get_field(changeset, :payload) do
      payload when is_map(payload) -> changeset
      nil -> put_change(changeset, :payload, %{})
      _ -> add_error(changeset, :payload, "must be a JSON object")
    end
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
