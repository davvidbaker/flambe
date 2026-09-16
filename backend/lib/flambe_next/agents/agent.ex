defmodule FlambeNext.Agents.Agent do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Accounts.User

  @name_sources ~w(provided assigned)

  schema "agents" do
    field :agent_id, :string
    field :name, :string
    field :name_source, :string
    field :platform, :string
    field :last_seen_at, :utc_datetime

    belongs_to :user, User

    timestamps(type: :utc_datetime)
  end

  def changeset(agent, attrs) do
    agent
    |> cast(attrs, [:agent_id, :name, :name_source, :platform, :last_seen_at])
    |> validate_required([:agent_id, :name, :name_source])
    |> validate_length(:agent_id, min: 1, max: 200)
    |> validate_length(:name, min: 1, max: 100)
    |> validate_length(:platform, max: 100)
    |> validate_inclusion(:name_source, @name_sources)
    |> unique_constraint([:user_id, :agent_id])
    |> assoc_constraint(:user)
  end
end
