defmodule Stitch.Accounts.Attention do
  use Ecto.Schema
  import Ecto.Changeset
  alias Stitch.Utilities
  alias Stitch.Accounts.{User}


  schema "attentions" do
    field :thread_id, :id
    field :timestamp, :utc_datetime
    field :timestamp_integer, :integer, virtual: true
    belongs_to :user, User

    timestamps()
  end

  @doc false
  def changeset(attention, attrs) do
    attention
    |> cast(attrs, [:timestamp_integer, :thread_id])
    |> validate_required([:timestamp_integer, :thread_id])
    |> Utilities.convert_timestamp_integer_to_datetime    
  end
end
