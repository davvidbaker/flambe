defmodule FlambeNext.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Accounts.{Category, Credential, Todo}
  alias FlambeNext.Traces.Trace

  schema "users" do
    field :name, :string
    field :username, :string

    has_many :credentials, Credential, on_replace: :delete
    has_many :traces, Trace
    has_many :categories, Category
    has_many :todos, Todo

    timestamps(type: :utc_datetime)
  end

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :username])
    |> validate_required([:name, :username])
    |> unique_constraint(:username)
  end

  def registration_changeset(user, attrs) do
    user
    |> changeset(attrs)
    |> cast_assoc(:credentials, with: &Credential.changeset/2, required: true)
  end
end
