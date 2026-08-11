defmodule FlambeNext.Traces.Activity do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Traces.{Event, Thread}

  schema "activities" do
    field :name, :string
    field :description, :string
    field :weight, :integer

    belongs_to :thread, Thread
    has_many :events, Event, on_delete: :delete_all

    timestamps(type: :utc_datetime)
  end

  def changeset(activity, attrs) do
    activity
    |> cast(attrs, [:name, :description, :weight])
    |> validate_required([:name])
    |> assoc_constraint(:thread)
  end
end
