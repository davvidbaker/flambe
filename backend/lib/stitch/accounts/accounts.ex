defmodule Stitch.Accounts do
  @moduledoc """
  The Accounts context.
  """

  import Ecto.Query, warn: false
  alias Stitch.Repo

  alias Stitch.Accounts.{User, Credential, Attention, Mantra, Category}

  @doc """
  Returns the list of todos for a particular user.

  ## Examples

      iex> list_user_todos(%User{})
      [%{id: integer, name: "my trace"}, ...]

  """
  def list_user_todos(user_id) do
    query = from todo in "todos", 
      where: todo.user_id == ^user_id, 
      select: map(todo, [:name, :id, :description])
    Repo.all(query)
  end

  @doc """
  Returns the list of mantras for a particular user.

  ## Examples

      iex> list_user_todos(%User{})
      [%{id: integer, name: "my trace"}, ...]

  """
  def list_user_mantras(user_id) do
    query = from mantra in Stitch.Accounts.Mantra, 
      where: mantra.user_id == ^user_id,
      select: map(mantra, [:name, :timestamp])

    Repo.all(query)
  end

  @doc """
  # ⚠️ this is not correct comment
  Returns the list of mantras for a particular user.

  ## Examples

      iex> list_user_todos(%User{})
      [%{id: integer, name: "my trace"}, ...]

  """
  def list_user_attentions(user_id) do
    query = from attention in Stitch.Accounts.Attention, 
      where: attention.user_id == ^user_id,
      select: map(attention, [:thread_id, :timestamp])

    Repo.all(query)
  end


  


  @doc """
  Returns the list of users.

  ## Examples

      iex> list_users()
      [%User{}, ...]

  """
  def list_users do
    User
    |> Repo.all()
    |> Repo.preload(:credential)
  end

  @doc """
  Gets a single user.

  Raises `Ecto.NoResultsError` if the User does not exist.

  ## Examples

      iex> get_user!(123)
      %User{}

      iex> get_user!(456)
      ** (Ecto.NoResultsError)

  """
  def get_user!(id) do
    User
    |> Repo.get!(id)
    |> Repo.preload(:credential)
  end

  def get_user_from_credential_info(%{provider: provider, uid: uid}) do

    query = from c in "credentials",
      where: c.provider == ^provider, 
      where: c.uid == ^uid,
      select: %{user_id: c.user_id}

      # ⚠️ This is probably inefficent
      case Repo.one(query) do
        %{user_id: user_id} -> {:ok, get_user!(user_id)}
        # %Credential{} = credential -> get_user!(credential.user_id)
        nil -> {:error, :does_not_exist}
      end
  end

  @doc """
  Creates a user.

  ## Examples

      iex> create_user(%{field: value})
      {:ok, %User{}}

      iex> create_user(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_user(attrs \\ %{}) do
    IO.inspect(attrs)
    {:ok, user} = %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
    
    user |> Ecto.build_assoc(:credential, attrs) |> IO.inspect |> Repo.insert()

    {:ok, user}
  end

  @doc """
  Updates a user.

  ## Examples

      iex> update_user(user, %{field: new_value})
      {:ok, %User{}}

      iex> update_user(user, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Ecto.Changeset.cast_assoc(:credential, with: &Credential.changeset/2) 
    |> Repo.update()
  end

  @doc """
  Deletes a User.

  ## Examples

      iex> delete_user(user)
      {:ok, %User{}}

      iex> delete_user(user)
      {:error, %Ecto.Changeset{}}

  """
  def delete_user(%User{} = user) do
    Repo.delete(user)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking user changes.

  ## Examples

      iex> change_user(user)
      %Ecto.Changeset{source: %User{}}

  """
  def change_user(%User{} = user) do
    User.changeset(user, %{})
  end

  alias Stitch.Accounts.Credential

  @doc """
  Returns the list of credentials.

  ## Examples

      iex> list_credentials()
      [%Credential{}, ...]

  """
  def list_credentials do
    Repo.all(Credential)
  end

  @doc """
  Gets a single credential.

  Raises `Ecto.NoResultsError` if the Credential does not exist.

  ## Examples

      iex> get_credential!(123)
      %Credential{}

      iex> get_credential!(456)
      ** (Ecto.NoResultsError)

  """
  def get_credential!(id), do: Repo.get!(Credential, id)

  @doc """
  Creates a credential.

  ## Examples

      iex> create_credential(%{field: value})
      {:ok, %Credential{}}

      iex> create_credential(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_credential(attrs \\ %{}) do
    %Credential{}
    |> Credential.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a credential.

  ## Examples

      iex> update_credential(credential, %{field: new_value})
      {:ok, %Credential{}}

      iex> update_credential(credential, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_credential(%Credential{} = credential, attrs) do
    credential
    |> Credential.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Credential.

  ## Examples

      iex> delete_credential(credential)
      {:ok, %Credential{}}

      iex> delete_credential(credential)
      {:error, %Ecto.Changeset{}}

  """
  def delete_credential(%Credential{} = credential) do
    Repo.delete(credential)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking credential changes.

  ## Examples

      iex> change_credential(credential)
      %Ecto.Changeset{source: %Credential{}}

  """
  def change_credential(%Credential{} = credential) do
    Credential.changeset(credential, %{})
  end

  def authenticate_by_email_password(email, _password) do
    query = 
      from u in "users",
        inner_join: c in assoc(u, :credential),
        where: c.email == ^email

    # ⚠️ we are discarding the password field for now! Could add authwith guardian here, I think.
    case Repo.one(query) do
      %User{} = user -> {:ok, user}
      nil -> {:error, :unauthorized}
    end
  end

  @doc """
  Returns the list of categories.

  ## Examples

      iex> list_categories()
      [%Category{}, ...]

  """
  def list_categories do
    Repo.all(Category)
  end

  @doc """
  Gets a single category.

  Raises `Ecto.NoResultsError` if the Category does not exist.

  ## Examples

      iex> get_category!(123)
      %Category{}

      iex> get_category!(456)
      ** (Ecto.NoResultsError)

  """
  def get_category!(id), do: Repo.get!(Category, id)

  @doc """
  Creates a category.

  ## Examples

      iex> create_category(%{field: value})
      {:ok, %Category{}}

      iex> create_category(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_category(activity_ids, user_id, attrs \\ %{}) do
    %Category{}
    |> Category.changeset(attrs)
    |> Ecto.Changeset.put_assoc(:activities, Enum.map(activity_ids, fn id -> Stitch.Traces.get_activity!(id) end))
    |> Ecto.Changeset.put_assoc(:user, Stitch.Accounts.get_user!(user_id))
    |> Repo.insert()
  end

  @doc """
  Updates a category.

  ## Examples

      iex> update_category(category, %{field: new_value})
      {:ok, %Category{}}

      iex> update_category(category, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_category(%Category{} = category, attrs) do
    category
    |> Category.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Category.

  ## Examples

      iex> delete_category(category)
      {:ok, %Category{}}

      iex> delete_category(category)
      {:error, %Ecto.Changeset{}}

  """
  def delete_category(%Category{} = category) do
    Repo.delete(category)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking category changes.

  ## Examples

      iex> change_category(category)
      %Ecto.Changeset{source: %Category{}}

  """
  def change_category(%Category{} = category) do
    Category.changeset(category, %{})
  end

  alias Stitch.Accounts.Todo

  @doc """
  Returns the list of todos.

  ## Examples

      iex> list_todos()
      [%Todo{}, ...]

  """
  def list_todos do
    Repo.all(Todo)
  end

  @doc """
  Gets a single todo.

  Raises `Ecto.NoResultsError` if the Todo does not exist.

  ## Examples

      iex> get_todo!(123)
      %Todo{}

      iex> get_todo!(456)
      ** (Ecto.NoResultsError)

  """
  def get_todo!(id), do: Repo.get!(Todo, id)

  @doc """
  Creates a todo.

  ## Examples

      iex> create_todo(%{field: value})
      {:ok, %Todo{}}

      iex> create_todo(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_todo(user_id, attrs \\ %{}) do
    %Todo{}
    |> Todo.changeset(attrs)
    |> Ecto.Changeset.put_assoc(:user, Stitch.Accounts.get_user!(user_id))
    |> Repo.insert()
  end

  @doc """
  Updates a todo.

  ## Examples

      iex> update_todo(todo, %{field: new_value})
      {:ok, %Todo{}}

      iex> update_todo(todo, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_todo(%Todo{} = todo, attrs) do
    todo
    |> Todo.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Todo.

  ## Examples

      iex> delete_todo(todo)
      {:ok, %Todo{}}

      iex> delete_todo(todo)
      {:error, %Ecto.Changeset{}}

  """
  def delete_todo(%Todo{} = todo) do
    Repo.delete(todo)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking todo changes.

  ## Examples

      iex> change_todo(todo)
      %Ecto.Changeset{source: %Todo{}}

  """
  def change_todo(%Todo{} = todo) do
    Todo.changeset(todo, %{})
  end


  @doc """
  Returns the list of mantras.

  ## Examples

      iex> list_mantras()
      [%Mantra{}, ...]

  """
  def list_mantras do
    Repo.all(Mantra)
  end

  @doc """
  Gets a single mantra.

  Raises `Ecto.NoResultsError` if the Mantra does not exist.

  ## Examples

      iex> get_mantra!(123)
      %Mantra{}

      iex> get_mantra!(456)
      ** (Ecto.NoResultsError)

  """
  def get_mantra!(id), do: Repo.get!(Mantra, id)

  @doc """
  Creates a mantra.
# ⚠️  example is not correct
  ## Examples

      iex> create_mantra(%{field: value})
      {:ok, %Mantra{}}

      iex> create_mantra(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_mantra(user_id, attrs \\ %{}) do
    %Mantra{}
    |> Mantra.changeset(attrs)
    |> Ecto.Changeset.put_assoc(:user, Stitch.Accounts.get_user!(user_id))    
    |> Repo.insert()
  end

  @doc """
  Updates a mantra.

  ## Examples

      iex> update_mantra(mantra, %{field: new_value})
      {:ok, %Mantra{}}

      iex> update_mantra(mantra, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_mantra(%Mantra{} = mantra, attrs) do
    mantra
    |> Mantra.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Mantra.

  ## Examples

      iex> delete_mantra(mantra)
      {:ok, %Mantra{}}

      iex> delete_mantra(mantra)
      {:error, %Ecto.Changeset{}}

  """
  def delete_mantra(%Mantra{} = mantra) do
    Repo.delete(mantra)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking mantra changes.

  ## Examples

      iex> change_mantra(mantra)
      %Ecto.Changeset{source: %Mantra{}}

  """
  def change_mantra(%Mantra{} = mantra) do
    Mantra.changeset(mantra, %{})
  end


  @doc """
  Returns the list of mantras.

  ## Examples

      iex> list_mantras()
      [%Mantra{}, ...]

  """
  def list_mantras do
    Repo.all(Mantra)
  end

  @doc """
  Gets a single mantra.

  Raises `Ecto.NoResultsError` if the Mantra does not exist.

  ## Examples

      iex> get_mantra!(123)
      %Mantra{}

      iex> get_mantra!(456)
      ** (Ecto.NoResultsError)

  """
  def get_attention!(id), do: Repo.get!(Attention, id)

  @doc """
  Creates an attenion (shift).
# ⚠️  example is not correct
  ## Examples

      iex> create_mantra(%{field: value})
      {:ok, %Mantra{}}

      iex> create_mantra(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_attention(user_id, attrs \\ %{}) do
    %Attention{}
    |> Attention.changeset(attrs)
    |> Ecto.Changeset.put_assoc(:user, Stitch.Accounts.get_user!(user_id))    
    |> Repo.insert()
  end

  @doc """
  Updates a mantra.

  ## Examples

      iex> update_mantra(mantra, %{field: new_value})
      {:ok, %Mantra{}}

      iex> update_mantra(mantra, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_attention(%Attention{} = attention, attrs) do
    attention
    |> Attention.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Mantra.

  ## Examples

      iex> delete_mantra(mantra)
      {:ok, %Mantra{}}

      iex> delete_mantra(mantra)
      {:error, %Ecto.Changeset{}}

  """
  def delete_attention(%Attention{} = attention) do
    Repo.delete(attention)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking mantra changes.

  ## Examples

      iex> change_mantra(mantra)
      %Ecto.Changeset{source: %Mantra{}}

  """
  def change_attention(%Attention{} = attention) do
    Attention.changeset(attention, %{})
  end
end
