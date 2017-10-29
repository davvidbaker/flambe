defmodule Stitch.Traces.Activity do
  use Ecto.Schema
  import Ecto.Changeset
  alias Stitch.Traces.{Activity, Event, Thread}
  alias Stitch.Accounts.{Category}


  schema "activities" do
    field :description, :string
    field :name, :string
    has_many :events, Event
    belongs_to :thread, Thread
    many_to_many :categories, Category, join_through: "activities_categories"

    timestamps()
  end

  @doc false
  def changeset(%Activity{} = activity, attrs) do
    activity
    |> cast(attrs, [:name, :description])
    |> validate_required([:name])
  end
end
