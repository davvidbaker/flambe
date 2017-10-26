defmodule Stitch.Traces.Activity do
  use Ecto.Schema
  import Ecto.Changeset
  alias Stitch.Traces.{Activity, Event}


  schema "activities" do
    field :description, :string
    field :name, :string
    has_many :events, Event

    timestamps()
  end

  @doc false
  def changeset(%Activity{} = activity, attrs) do
    activity
    |> cast(attrs, [:name, :description])
    |> validate_required([:name, :description])
  end
end
