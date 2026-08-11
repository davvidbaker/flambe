defmodule FlambeNext.Accounts.Category do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Accounts.User
  alias FlambeNext.Traces.Activity

  schema "categories" do
    field :name, :string
    field :color_background, :string
    field :color_text, :string

    belongs_to :user, User
    many_to_many :activities, Activity, join_through: "activities_categories", on_replace: :delete

    timestamps(type: :utc_datetime)
  end

  def changeset(category, attrs) do
    category
    |> cast(attrs, [:name, :color_background, :color_text])
    |> validate_required([:name, :color_background])
    |> unique_constraint([:user_id, :name])
    |> assoc_constraint(:user)
  end
end
