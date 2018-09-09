defmodule Flambe.Traces.Thread do
  use Ecto.Schema
  import Ecto.Changeset
  alias Flambe.Traces.{Thread, Activity}

  schema "threads" do
    field(:name, :string)
    field(:rank, :integer, default: 0)
    belongs_to(:trace, Flambe.Traces.Trace)
    has_many(:activities, Activity, on_delete: :delete_all)

    timestamps()
  end

  @doc false
  def changeset(%Thread{} = thread, attrs) do
    thread
    |> cast(attrs, [:name, :rank])
    |> validate_required([:name])
  end
end
