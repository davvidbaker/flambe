defmodule FlambeNext.Accounts do
  import Ecto.Query

  alias FlambeNext.Accounts.{Attention, Category, Mantra, SearchTerm, Tab, Todo, User}
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

  def get_user_by_email(email) when is_binary(email) do
    from(user in User,
      join: credential in assoc(user, :credentials),
      where: credential.email == ^email
    )
    |> Repo.one()
  end

  def get_current_user!(%User{} = user, id) when is_binary(id) do
    if Integer.to_string(user.id) == id,
      do: user,
      else: raise(Ecto.NoResultsError, queryable: User)
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

  def list_user_mantras(%User{} = user) do
    from(mantra in Mantra, where: mantra.user_id == ^user.id, order_by: [asc: mantra.timestamp])
    |> Repo.all()
  end

  def get_user_mantra!(%User{} = user, id) do
    from(mantra in Mantra, where: mantra.id == ^id and mantra.user_id == ^user.id)
    |> Repo.one!()
  end

  def create_mantra(%User{} = user, attrs) do
    %Mantra{user_id: user.id}
    |> Mantra.changeset(attrs)
    |> Repo.insert()
  end

  def update_mantra(%Mantra{} = mantra, attrs),
    do: mantra |> Mantra.changeset(attrs) |> Repo.update()

  def delete_mantra(%Mantra{} = mantra), do: Repo.delete(mantra)

  def list_user_attentions(%User{} = user) do
    from(attention in Attention,
      where: attention.user_id == ^user.id,
      order_by: [asc: attention.timestamp]
    )
    |> Repo.all()
  end

  def get_user_attention!(%User{} = user, id) do
    from(attention in Attention, where: attention.id == ^id and attention.user_id == ^user.id)
    |> Repo.one!()
  end

  def create_attention(%User{} = user, attrs) do
    %Attention{user_id: user.id}
    |> Attention.changeset(attrs)
    |> Repo.insert()
  end

  def update_attention(%Attention{} = attention, attrs),
    do: attention |> Attention.changeset(attrs) |> Repo.update()

  def delete_attention(%Attention{} = attention), do: Repo.delete(attention)

  def list_user_tabs(%User{} = user) do
    from(tab in Tab, where: tab.user_id == ^user.id, order_by: [asc: tab.timestamp])
    |> Repo.all()
  end

  def get_user_tab!(%User{} = user, id) do
    from(tab in Tab, where: tab.id == ^id and tab.user_id == ^user.id)
    |> Repo.one!()
  end

  def create_tab(%User{} = user, attrs) do
    %Tab{user_id: user.id}
    |> Tab.changeset(attrs)
    |> Repo.insert()
  end

  def update_tab(%Tab{} = tab, attrs), do: tab |> Tab.changeset(attrs) |> Repo.update()
  def delete_tab(%Tab{} = tab), do: Repo.delete(tab)

  def list_user_search_terms(%User{} = user) do
    from(search_term in SearchTerm,
      where: search_term.user_id == ^user.id,
      order_by: [asc: search_term.timestamp]
    )
    |> Repo.all()
  end

  def get_user_search_term!(%User{} = user, id) do
    from(search_term in SearchTerm,
      where: search_term.id == ^id and search_term.user_id == ^user.id
    )
    |> Repo.one!()
  end

  def create_search_term(%User{} = user, attrs) do
    %SearchTerm{user_id: user.id}
    |> SearchTerm.changeset(attrs)
    |> Repo.insert()
  end

  def update_search_term(%SearchTerm{} = search_term, attrs),
    do: search_term |> SearchTerm.changeset(attrs) |> Repo.update()

  def delete_search_term(%SearchTerm{} = search_term), do: Repo.delete(search_term)

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
