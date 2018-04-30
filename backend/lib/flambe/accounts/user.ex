defmodule Flambe.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset
  alias Flambe.Accounts.{User, Credential, Category, Mantra}

  schema "users" do
    field(:name, :string)

    # ⚠️ not sure if on_replace: :delete is correct/idk what it does, but thinking it might be correct
    has_many(:credential, Credential, on_replace: :delete)
    has_many(:traces, Flambe.Traces.Trace)
    has_many(:categories, Category)
    has_many(:mantras, Mantra)

    timestamps()
  end

  @doc false
  def changeset(%User{} = user, attrs) do
    user
    |> cast(attrs, [:name, :note_to_self])
    |> validate_required([:name])
  end
end
