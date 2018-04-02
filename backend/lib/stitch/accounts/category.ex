defmodule Stitch.Accounts.Category do
  use Ecto.Schema
  import Ecto.Changeset
  alias Stitch.Accounts.{Category, User}
  alias Stitch.Traces.{Activity}


  schema "categories" do
    field :color_background, :string
    field :color_text, :string
    field :name, :string
    belongs_to :user, User
    many_to_many :activities, Activity, join_through: "activities_categories"

    timestamps()
  end

  @doc false
  def changeset(%Category{} = category, attrs) do
    category
    |> cast(attrs, [:name, :color_background, :color_text])
    |> validate_required([:name, :color_background])
    # 💁 the :name atom and name: key are not related! beware!
    |> unique_constraint(:name, name: :user_category_index)
  end
end
