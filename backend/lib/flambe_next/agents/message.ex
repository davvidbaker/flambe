defmodule FlambeNext.Agents.Message do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Accounts.User
  alias FlambeNext.Traces.Trace

  @max_body_bytes 4000

  schema "agent_messages" do
    field :agent_id, :string
    field :body, :string
    field :delivered_at, :utc_datetime_usec

    belongs_to :user, User
    belongs_to :trace, Trace

    timestamps(type: :utc_datetime_usec)
  end

  def changeset(message, attrs) do
    message
    |> cast(attrs, [:agent_id, :body])
    |> update_change(:body, &String.trim/1)
    |> validate_required([:agent_id, :body])
    |> validate_length(:agent_id, min: 1, max: 200)
    |> validate_length(:body, min: 1, max: @max_body_bytes, count: :bytes)
    |> assoc_constraint(:user)
    |> assoc_constraint(:trace)
  end
end
