defmodule FlambeNext.Traces.Activity do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Accounts.Category
  alias FlambeNext.Traces.{Event, Thread}

  schema "activities" do
    field :name, :string
    field :description, :string
    field :weight, :integer
    field :agent_id, :string
    field :agent_name, :string
    field :scheduled_start, :utc_datetime_usec
    field :scheduled_end, :utc_datetime_usec
    field :proposed_by_agent_id, :string
    field :proposed_by_agent_name, :string

    belongs_to :thread, Thread
    belongs_to :parent, __MODULE__, foreign_key: :parent_id
    has_many :children, __MODULE__, foreign_key: :parent_id
    has_many :events, Event, on_delete: :delete_all
    many_to_many :categories, Category, join_through: "activities_categories", on_replace: :delete

    timestamps(type: :utc_datetime)
  end

  def changeset(activity, attrs) do
    activity
    |> cast(attrs, [
      :name,
      :description,
      :weight,
      :agent_id,
      :agent_name,
      :scheduled_start,
      :scheduled_end,
      :proposed_by_agent_id,
      :proposed_by_agent_name
    ])
    |> cast_schedule(attrs, :scheduled_start)
    |> cast_schedule(attrs, :scheduled_end)
    |> validate_required([:name])
    |> validate_schedule()
    |> assoc_constraint(:thread)
  end

  defp cast_schedule(changeset, attrs, field) do
    string_key = Atom.to_string(field)
    integer_key = string_key <> "_integer"

    cond do
      schedule_cleared?(attrs, field, string_key) ->
        put_change(changeset, field, nil)

      Map.has_key?(attrs, integer_key) or Map.has_key?(attrs, String.to_atom(integer_key)) ->
        put_schedule_ms(changeset, field, schedule_integer(attrs, integer_key))

      true ->
        changeset
    end
  end

  defp schedule_cleared?(attrs, field, string_key) do
    (Map.has_key?(attrs, string_key) and is_nil(attrs[string_key])) or
      (Map.has_key?(attrs, field) and is_nil(attrs[field]))
  end

  defp schedule_integer(attrs, integer_key) do
    Map.get(attrs, integer_key) || Map.get(attrs, String.to_atom(integer_key))
  end

  defp put_schedule_ms(changeset, _field, nil), do: changeset

  defp put_schedule_ms(changeset, field, timestamp) when is_integer(timestamp) do
    case DateTime.from_unix(timestamp, :millisecond) do
      {:ok, datetime} ->
        put_change(changeset, field, DateTime.add(datetime, 0, :microsecond))

      {:error, _reason} ->
        add_error(changeset, field, "is invalid")
    end
  end

  defp put_schedule_ms(changeset, field, _timestamp),
    do: add_error(changeset, field, "is invalid")

  defp validate_schedule(changeset) do
    start = get_field(changeset, :scheduled_start)
    ending = get_field(changeset, :scheduled_end)

    if start && ending && DateTime.compare(ending, start) == :lt do
      add_error(changeset, :scheduled_end, "must be at or after scheduled_start")
    else
      changeset
    end
  end
end
