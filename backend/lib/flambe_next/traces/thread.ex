defmodule FlambeNext.Traces.Thread do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Traces.{Activity, Trace}

  schema "threads" do
    field :name, :string
    field :rank, :integer, default: 0

    belongs_to :trace, Trace
    has_many :activities, Activity, on_delete: :delete_all

    timestamps(type: :utc_datetime)
  end

  def changeset(thread, attrs) do
    thread
    |> cast(attrs, [:name, :rank])
    |> validate_required([:name])
    |> assoc_constraint(:trace)
  end
end
