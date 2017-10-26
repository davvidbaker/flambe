defmodule Stitch.Traces.Trace do
  use Ecto.Schema
  import Ecto.Changeset
  alias Stitch.Traces.{Trace, Event}

  schema "traces" do
    field :name, :string
    
    has_many :events, Event
    belongs_to :user, Stitch.Accounts.User

    timestamps()
  end

  @doc false
  def changeset(%Trace{} = trace, attrs) do
    trace
    |> cast(attrs, [:name])
    |> validate_required([:name])
    |> unique_constraint(:name)
  end
end
