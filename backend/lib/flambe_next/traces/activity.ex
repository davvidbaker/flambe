defmodule FlambeNext.Traces.Activity do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Accounts.Category
  alias FlambeNext.Traces.{Event, Thread}

  schema "activities" do
    field :name, :string
    field :description, :string
    field :weight, :integer

    belongs_to :thread, Thread
    belongs_to :parent, __MODULE__, foreign_key: :parent_id
    has_many :children, __MODULE__, foreign_key: :parent_id
    has_many :events, Event, on_delete: :delete_all
    many_to_many :categories, Category, join_through: "activities_categories", on_replace: :delete

    timestamps(type: :utc_datetime)
  end

  def changeset(activity, attrs) do
    activity
    |> cast(attrs, [:name, :description, :weight])
    |> validate_required([:name])
    |> assoc_constraint(:thread)
  end
end
