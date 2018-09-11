defmodule Flambe.Traces.Trace do
  use Ecto.Schema
  import Ecto.Changeset
  alias Flambe.Traces.{Trace, Event, Thread}

# ⚠️ not positive I only want to encode the :name and :id...
  @derive {Poison.Encoder, only: [:name, :id]}
  schema "traces" do
    field(:name, :string)

    has_many(:events, Event)
    has_many(:threads, Thread, on_delete: :delete_all)
    belongs_to(:user, Flambe.Accounts.User)

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
