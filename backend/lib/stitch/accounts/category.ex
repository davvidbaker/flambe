defmodule Stitch.Accounts.Category do
  use Ecto.Schema
  import Ecto.Changeset
  alias Stitch.Accounts.{Category, User}
  alias Stitch.Traces.{Activity}


  schema "categories" do
    field :color, :string
    field :name, :string
    belongs_to :user, User
    many_to_many :activities, Activity, join_through: "activities_categories"

    timestamps()
  end

  @doc false
  def changeset(%Category{} = category, attrs) do
    category
    |> cast(attrs, [:name, :color])
    |> validate_required([:name, :color])
  end
end
