defmodule Flambe.Accounts.Todo do
  use Ecto.Schema
  import Ecto.Changeset
  alias Flambe.Accounts.{Todo, User}

  schema "todos" do
    field(:description, :string)
    field(:name, :string)

    belongs_to(:user, User)

    timestamps()
  end

  @doc false
  def changeset(%Todo{} = todo, attrs) do
    todo
    |> cast(attrs, [:name, :description])
    |> validate_required([:name])
  end
end
