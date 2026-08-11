defmodule FlambeNext.Accounts.Todo do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Accounts.User

  schema "todos" do
    field :name, :string
    field :description, :string

    belongs_to :user, User

    timestamps(type: :utc_datetime)
  end

  def changeset(todo, attrs) do
    todo
    |> cast(attrs, [:name, :description])
    |> validate_required([:name])
    |> assoc_constraint(:user)
  end
end
