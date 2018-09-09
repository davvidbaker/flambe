defmodule Flambe.Accounts.Credential do
  use Ecto.Schema
  import Ecto.Changeset
  alias Flambe.Accounts.{Credential, User}

  schema "credentials" do
    # credential can either be email and pass or...
    field(:email, :string)
    field(:password, :string, virtual: true)
    field(:password_hash, :string)

    # ... a social identity. Can it be both?
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
    credential
    |> cast(attrs, [:email, :password, :uid, :avatar, :name, :provider])
    |> validate_something(attrs)
  end

  defp validate_something(changeset, %{:provider => _provider} = _attrs) do
    changeset
    |> validate_required([:uid, :avatar, :name, :provider])

    # |> validate_length(:password, min: 6, max: 100)
    # |> unique_constraint(:email)
    # |> put_pass_hash()
  end

  defp validate_something(changeset, %{:email => _email} = _attrs) do
    changeset
    |> validate_required([:email, :password])
    |> validate_length(:password, min: 6, max: 100)
    |> unique_constraint(:email)
    |> put_pass_hash()
  end

  defp put_pass_hash(changeset) do
    case changeset do
      %Ecto.Changeset{valid?: true, changes: %{password: pass}} ->
        put_change(changeset, :password_hash, Comeonin.Pbkdf2.hashpwsalt(pass))

      _ ->
        changeset
    end
  end
end
