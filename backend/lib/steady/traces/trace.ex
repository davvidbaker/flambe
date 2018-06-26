defmodule Steady.Traces.Trace do
  use Ecto.Schema
  import Ecto.Changeset
  alias Steady.Traces.{Trace, Event, Thread}

  schema "traces" do
    field(:name, :string)

    has_many(:events, Event)
    has_many(:threads, Thread, on_delete: :delete_all)
    belongs_to(:user, Steady.Accounts.User)

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
