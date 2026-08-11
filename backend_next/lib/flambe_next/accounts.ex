defmodule FlambeNext.Accounts do
  import Ecto.Query

  alias FlambeNext.Accounts.{Category, Todo, User}
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

  def get_current_user!(%User{} = user, id) when is_binary(id) do
    if Integer.to_string(user.id) == id, do: user, else: raise(Ecto.NoResultsError)
  end

  def list_user_categories(%User{} = user) do
    from(category in Category, where: category.user_id == ^user.id, order_by: [asc: category.id])
    |> Repo.all()
  end

  def get_user_category!(%User{} = user, id) do
    from(category in Category, where: category.id == ^id and category.user_id == ^user.id)
    |> Repo.one!()
  end

  def get_user_categories(%User{} = user, ids) when is_list(ids) do
    categories =
      from(category in Category, where: category.id in ^ids and category.user_id == ^user.id)
      |> Repo.all()

    if length(categories) == length(Enum.uniq(ids)),
      do: {:ok, categories},
      else: {:error, :not_found}
  end

  def create_category(%User{} = user, activities, attrs) do
    %Category{user_id: user.id}
    |> Category.changeset(attrs)
    |> Ecto.Changeset.put_assoc(:activities, activities)
    |> Repo.insert()
  end

  def update_category(%Category{} = category, attrs) do
    category
    |> Category.changeset(attrs)
    |> Repo.update()
  end

  def delete_category(%Category{} = category), do: Repo.delete(category)

  def list_user_todos(%User{} = user) do
    from(todo in Todo, where: todo.user_id == ^user.id, order_by: [asc: todo.id])
    |> Repo.all()
  end

  def get_user_todo!(%User{} = user, id) do
    from(todo in Todo, where: todo.id == ^id and todo.user_id == ^user.id)
    |> Repo.one!()
  end

  def create_todo(%User{} = user, attrs) do
    %Todo{user_id: user.id}
    |> Todo.changeset(attrs)
    |> Repo.insert()
  end

  def update_todo(%Todo{} = todo, attrs) do
    todo
    |> Todo.changeset(attrs)
    |> Repo.update()
  end

  def delete_todo(%Todo{} = todo), do: Repo.delete(todo)

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
