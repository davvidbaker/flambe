defmodule Flambe.Accounts.Credential do
  use Ecto.Schema
  import Ecto.Changeset
  alias Flambe.Accounts.{Credential, User}

  schema "credentials" do
    field(:email, :string)
    field(:uid, :integer)
    field(:avatar, :string)
    field(:name, :string)
    # something like "github"
    field(:provider, :string)
    belongs_to(:user, User)

    timestamps()
  end

  @doc false
  def changeset(%Credential{} = credential, attrs) do
    IO.puts("\ncredentialll😍")
    IO.inspect(credential)
    IO.inspect(attrs)

    credential
    |> cast(attrs, [:email, :uid, :avatar, :name, :provider])
    # |> validate_something_required(attrs)
    |> validate_required([:uid, :avatar, :name, :provider])
    |> IO.inspect()
    # 🔮 add unique constraint
    |> unique_constraint(:uid, name: :credentials_uid_provider_index)
  end

  # defp validate_something_required(changeset, attrs) do
  #   IO.puts "\nchangeset"
  #   IO.inspect changeset
  #   changeset = 
  #     with {:error} <- validate_required(changeset, [:email]),
  #          do: validate_required(changeset, [:uid, :avatar, :name, :strategy])
  #   changeset
  # end
end
