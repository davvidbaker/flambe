defmodule FlambeNext.Accounts do
  import Ecto.Query

  alias FlambeNext.Accounts.User
  alias FlambeNext.Repo

  def create_user(attrs) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  def register_user(attrs) do
    %User{}
    |> User.registration_changeset(attrs)
    |> Repo.insert()
  end

  def get_user(id), do: Repo.get(User, id)

  def authenticate_by_email_password(email, password) do
    user =
      from(user in User,
        join: credential in assoc(user, :credentials),
        where: credential.email == ^email,
        preload: [credentials: credential]
      )
      |> Repo.one()

    credential = user && Enum.find(user.credentials, &(&1.email == email))

    if credential && Bcrypt.verify_pass(password, credential.password_hash) do
      {:ok, user}
    else
      Bcrypt.no_user_verify()
      {:error, :invalid_credentials}
    end
  end
end
