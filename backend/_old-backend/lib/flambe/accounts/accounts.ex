defmodule Flambe.Accounts do
  @moduledoc """
  The Accounts context.
  """

  import Ecto.Query, warn: false
  alias Flambe.Repo

  alias Flambe.Accounts.{User, Credential, Attention, Mantra, Category}

  @doc """
  Returns the list of todos for a particular user.

  ## Examples

      iex> list_user_todos(%User{})
      [%{id: integer, name: "my trace"}, ...]

  """
  def list_user_todos(user_id) do
    query =
      from(
        todo in "todos",
        where: todo.user_id == ^user_id,
        select: map(todo, [:name, :id, :description])
      )

    Repo.all(query)
  end

  @doc """
  Returns the list of mantras for a particular user.

  ## Examples

      iex> list_user_todos(%User{})
      [%{id: integer, name: "my trace"}, ...]

  """
  def list_user_mantras(user_id) do
    query =
      from(
        mantra in Flambe.Accounts.Mantra,
        where: mantra.user_id == ^user_id,
        select: map(mantra, [:name, :timestamp])
      )

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
    query =
      from(
        attention in Flambe.Accounts.Attention,
        where: attention.user_id == ^user_id,
        select: map(attention, [:thread_id, :timestamp])
      )

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
    |> Repo.preload(:credentials)
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
    |> Repo.preload(:credentials)
  end

  def get_user_from_credential_info(%{provider: provider, uid: uid}) do
    query =
      from(
        c in "credentials",
        where: c.provider == ^provider,
        where: c.uid == ^uid,
        select: %{user_id: c.user_id}
      )

    # ⚠️ This is probably inefficent
    case Repo.one(query) do
      %{user_id: user_id} ->
        {:ok, get_user!(user_id)}

      # %Credential{} = credential -> get_user!(credential.user_id)
      nil ->
        {:error, :does_not_exist}
    end
  end

  def get_user_from_username(username) do
    from(u in User, where: u.username == ^username, select: u)
    |> Repo.one()
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
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  def register_user(attrs \\ %{}) do
    %User{}
    |> User.registration_changeset(attrs)
    |> Repo.insert()
  end

  def create_user_access_token(user) do
    {:ok, jwt, claims} = Flambe.Guardian.encode_and_sign(user)
    IO.puts("\n🔥claims")
    IO.inspect(claims)
    jwt
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

  def add_user_integration(%User{} = user, attrs) do
    user
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

  alias Flambe.Accounts.Credential

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

  def get_user_by_email(email) do
    from(u in User, join: c in assoc(u, :credentials), where: c.email == ^email)
    |> Repo.one()
    |> Repo.preload(:credentials)
  end

  def authenticate_by_email_password(email, given_pass) do
    user = get_user_by_email(email)

    # ⚠️ hacky. Should probably be using a `with` block...
    [%{password_hash: password_hash}] = (user && user.credentials) || [%{password_hash: nil}]

    cond do
      user && Comeonin.Pbkdf2.checkpw(given_pass, password_hash) ->
        {:ok, user}

      user ->
        {:error, :unauthorized}

      true ->
        Comeonin.Bcrypt.dummy_checkpw()
        {:error, :not_found}
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
    |> Ecto.Changeset.put_assoc(
      :activities,
      Enum.map(activity_ids, fn id -> Flambe.Traces.get_activity!(id) end)
    )
    |> Ecto.Changeset.put_assoc(:user, Flambe.Accounts.get_user!(user_id))
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

  alias Flambe.Accounts.Todo

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
    |> Ecto.Changeset.put_assoc(:user, Flambe.Accounts.get_user!(user_id))
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
    |> Ecto.Changeset.put_assoc(:user, Flambe.Accounts.get_user!(user_id))
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
    |> Ecto.Changeset.put_assoc(:user, Flambe.Accounts.get_user!(user_id))
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

  alias Flambe.Accounts.Tabs

  @doc """
  Returns the list of tabs.

  ## Examples

      iex> list_tabs()
      [%Tabs{}, ...]

  """
  def list_tabs do
    Repo.all(Tabs)
  end

  def list_user_tabs(user_id) do
    query =
      from(
        tabs in Tabs,
        where: tabs.user_id == ^user_id,
        select: map(tabs, [:count, :window_count, :timestamp])
      )

    Repo.all(query)
  end

  @doc """
  Gets a single tabs.

  Raises `Ecto.NoResultsError` if the Tabs does not exist.

  ## Examples

      iex> get_tabs!(123)
      %Tabs{}

      iex> get_tabs!(456)
      ** (Ecto.NoResultsError)

  """
  def get_tabs!(id), do: Repo.get!(Tabs, id)

  @doc """
  Creates a tabs.

  ## Examples

      iex> create_tabs(%{field: value})
      {:ok, %Tabs{}}

      iex> create_tabs(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_tabs(user_id, attrs \\ %{}) do
    %Tabs{}
    |> Tabs.changeset(attrs)
    |> Ecto.Changeset.put_assoc(:user, Flambe.Accounts.get_user!(user_id))
    |> Repo.insert()
  end

  @doc """
  Updates a tabs.

  ## Examples

      iex> update_tabs(tabs, %{field: new_value})
      {:ok, %Tabs{}}

      iex> update_tabs(tabs, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_tabs(%Tabs{} = tabs, attrs) do
    tabs
    |> Tabs.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Tabs.

  ## Examples

      iex> delete_tabs(tabs)
      {:ok, %Tabs{}}

      iex> delete_tabs(tabs)
      {:error, %Ecto.Changeset{}}

  """
  def delete_tabs(%Tabs{} = tabs) do
    Repo.delete(tabs)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking tabs changes.

  ## Examples

      iex> change_tabs(tabs)
      %Ecto.Changeset{source: %Tabs{}}

  """
  def change_tabs(%Tabs{} = tabs) do
    Tabs.changeset(tabs, %{})
  end

  alias Flambe.Accounts.SearchTerm

  @doc """
  Returns the list of SearchTerms.

  ## Examples

      iex> list_search_term()
      [%SearchTerm{}, ...]

  """
  def list_search_terms do
    Repo.all(SearchTerm)
  end

  def list_user_search_terms(user_id) do
    query =
      from(
        search_term in Flambe.Accounts.SearchTerm,
        where: search_term.user_id == ^user_id,
        select: map(search_term, [:term, :timestamp])
      )

    Repo.all(query)
  end

  @doc """
  Gets a single search_term.

  Raises `Ecto.NoResultsError` if the SearchTerm does not exist.

  ## Examples

      iex> get_search_term!(123)
      %SearchTerm{}

      iex> get_search_term!(456)
      ** (Ecto.NoResultsError)

  """
  def get_search_term!(id), do: Repo.get!(SearchTerm, id)

  @doc """
  Creates a search_term.

  ## Examples

      iex> create_search_term(%{field: value})
      {:ok, %SearchTerm{}}

      iex> create_search_term(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_search_term(user_id, attrs \\ %{}) do
    %SearchTerm{}
    |> SearchTerm.changeset(attrs)
    |> Ecto.Changeset.put_assoc(:user, Flambe.Accounts.get_user!(user_id))
    |> Repo.insert()
  end

  @doc """
  Updates a search_term.

  ## Examples

      iex> update_search_term(search_term, %{field: new_value})
      {:ok, %SearchTerm{}}

      iex> update_search_term(search_term, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_search_term(%SearchTerm{} = search_term, attrs) do
    search_term
    |> SearchTerm.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a SearchTerm.

  ## Examples

      iex> delete_search_term(search_term)
      {:ok, %SearchTerm{}}

      iex> delete_search_term(search_term)
      {:error, %Ecto.Changeset{}}

  """
  def delete_search_term(%SearchTerm{} = search_term) do
    Repo.delete(search_term)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking search_term changes.

  ## Examples

      iex> change_search_term(search_term)
      %Ecto.Changeset{source: %SearchTerm{}}

  """
  def change_search_term(%SearchTerm{} = search_term) do
    SearchTerm.changeset(search_term, %{})
  end
end
