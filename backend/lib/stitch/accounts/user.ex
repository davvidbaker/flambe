defmodule Stitch.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset
  alias Stitch.Accounts.{User, Credential, Category}

  schema "users" do
    field :name, :string
    field :note_to_self, :string
    has_many :credential, Credential, on_replace: :delete # ⚠️ not sure if on_replace: :delete is correct/idk what it does
    has_many :traces, Stitch.Traces.Trace
    has_many :categories, Category
    
    timestamps()
  end

  @doc false
  def changeset(%User{} = user, attrs) do
    user
    |> cast(attrs, [:name, :note_to_self])
    |> validate_required([:name])
  end
end
