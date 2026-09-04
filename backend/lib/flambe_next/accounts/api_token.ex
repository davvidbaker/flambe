defmodule FlambeNext.Accounts.ApiToken do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Accounts.User

  @derive {Inspect, except: [:token_hash]}

  schema "api_tokens" do
    field :name, :string
    field :token_hash, :string
    field :last_used_at, :utc_datetime

    belongs_to :user, User

    timestamps(type: :utc_datetime)
  end

  def changeset(api_token, attrs) do
    api_token
    |> cast(attrs, [:name, :token_hash])
    |> validate_required([:name, :token_hash])
    |> validate_length(:name, min: 1, max: 100)
    |> validate_length(:token_hash, is: 64)
    |> unique_constraint(:token_hash)
    |> assoc_constraint(:user)
  end
end
