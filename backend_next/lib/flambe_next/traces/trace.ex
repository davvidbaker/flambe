defmodule FlambeNext.Traces.Trace do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Accounts.User
  alias FlambeNext.Traces.Thread

  schema "traces" do
    field :name, :string

    belongs_to :user, User
    has_many :threads, Thread, on_delete: :delete_all

    timestamps(type: :utc_datetime)
  end

  def changeset(trace, attrs) do
    trace
    |> cast(attrs, [:name])
    |> validate_required([:name])
    |> unique_constraint(:name)
    |> assoc_constraint(:user)
  end
end
