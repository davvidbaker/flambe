defmodule Steady.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset
  alias Steady.Accounts.{User, Credential, Category, Mantra}

  schema "users" do
    field(:name, :string)
    field(:username, :string)

    # ⚠️ not sure if on_replace: :delete is correct/idk what it does, but thinking it might be correct
    has_many(:credential, Credential, on_replace: :delete)
    has_many(:traces, Steady.Traces.Trace)
    has_many(:categories, Category)
    has_many(:mantras, Mantra)

    timestamps()
  end

  @doc false
  def changeset(%User{} = user, attrs) do
    user
    |> cast(attrs, [:name, :username])
    |> validate_required([:name, :username])
    |> validate_length(:username, min: 1, max: 20)
    |> unique_constraint(:username)
  end

  def registration_changeset(user, params) do
    user
    |> changeset(params)
    |> cast_assoc(:credential, with: &Credential.changeset/2)
  end
end
