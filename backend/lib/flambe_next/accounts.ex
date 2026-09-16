defmodule FlambeNext.Accounts do
  import Ecto.Query

  alias FlambeNext.Accounts.{
    Attention,
    Category,
    Mantra,
    Observation,
    SearchTerm,
    Tab,
    Todo,
    User
  }

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

  @doc """
  The palette new users and incomplete accounts get. Names and colors are the
  work-kind labels from David's local Flambe database, not the five-item chart
  fixture vocabulary.
  """
  def default_categories do
    [
      %{"name" => "bug fixing", "color_background" => "#ff4747", "color_text" => "#000000"},
      %{"name" => "research", "color_background" => "#cd94f1", "color_text" => "#000000"},
      %{"name" => "cleaning", "color_background" => "#ffbd69", "color_text" => "#000000"},
      %{"name" => "bug hunting", "color_background" => "#ef60ab", "color_text" => "#000000"},
      %{"name" => "design", "color_background" => "#dce7ea", "color_text" => "#000000"},
      %{"name" => "writing tests", "color_background" => "#50f035", "color_text" => "#000000"},
      %{"name" => "toil", "color_background" => "#8b6125", "color_text" => "#ffffff"},
      %{"name" => "analytics", "color_background" => "#f9f9f9", "color_text" => "#4598d6"},
      %{"name" => "oss", "color_background" => "#60ef6c", "color_text" => "#000000"},
      %{"name" => "enhancements", "color_background" => "#55defb", "color_text" => "#ffffff"},
      %{
        "name" => "refactoring components",
        "color_background" => "#ffd368",
        "color_text" => "#000000"
      },
      %{"name" => "Fundamentals", "color_background" => "#acefdb", "color_text" => "#000000"},
      %{"name" => "jarring ui", "color_background" => "#f22d6a", "color_text" => "#ffffff"},
      %{"name" => "writing", "color_background" => "#ffefce", "color_text" => "#000000"},
      %{"name" => "risky", "color_background" => "#ff2a22", "color_text" => "#ffffff"},
      %{
        "name" => "dependency upgrades",
        "color_background" => "#b58e38",
        "color_text" => "#ffffff"
      },
      %{"name" => "shiny", "color_background" => "#f5ff86", "color_text" => "#000000"},
      %{"name" => "performance", "color_background" => "#60efc7", "color_text" => "#000000"},
      %{"name" => "learning", "color_background" => "#d3f791", "color_text" => "#000000"}
    ]
  end

  @doc """
  Inserts any `default_categories/0` name the user does not already have.
  Custom categories are kept; missing defaults are appended so existing
  accounts pick up an expanded palette without a wipe.
  """
  def ensure_default_categories(%User{} = user) do
    existing = list_user_categories(user)
    have = MapSet.new(existing, &String.downcase(&1.name))

    Enum.each(default_categories(), fn attrs ->
      unless MapSet.member?(have, String.downcase(attrs["name"])) do
        {:ok, _category} = create_category(user, [], attrs)
      end
    end)

    list_user_categories(user)
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

  def list_user_observations(%User{} = user, opts \\ []) do
    query =
      from(observation in Observation,
        where: observation.user_id == ^user.id,
        order_by: [asc: observation.timestamp]
      )

    query =
      case Keyword.get(opts, :kind) do
        kind when is_binary(kind) and kind != "" ->
          from(observation in query, where: observation.kind == ^String.downcase(kind))

        _ ->
          query
      end

    Repo.all(query)
  end

  def get_user_observation!(%User{} = user, id) do
    from(observation in Observation,
      where: observation.id == ^id and observation.user_id == ^user.id
    )
    |> Repo.one!()
  end

  def upsert_observation(%User{} = user, attrs) do
    attrs = stringify_keys(attrs)
    kind = Observation.changeset(%Observation{}, attrs) |> Ecto.Changeset.get_field(:kind)
    observed_on = parse_observed_on(Map.get(attrs, "observed_on"))

    existing =
      if is_binary(kind) and match?(%Date{}, observed_on) do
        Repo.one(
          from(observation in Observation,
            where:
              observation.user_id == ^user.id and observation.kind == ^kind and
                observation.observed_on == ^observed_on
          )
        )
      end

    case existing do
      nil ->
        with {:ok, observation} <- create_observation(user, attrs) do
          {:ok, observation, :created}
        end

      observation ->
        with {:ok, observation} <- update_observation(observation, attrs) do
          {:ok, observation, :updated}
        end
    end
  end

  def create_observation(%User{} = user, attrs) do
    %Observation{user_id: user.id}
    |> Observation.changeset(attrs)
    |> Repo.insert()
  end

  def update_observation(%Observation{} = observation, attrs) do
    observation
    |> Observation.changeset(merge_payload(observation, attrs))
    |> Repo.update()
  end

  def delete_observation(%Observation{} = observation), do: Repo.delete(observation)

  defp stringify_keys(attrs) when is_map(attrs) do
    Map.new(attrs, fn
      {key, value} when is_atom(key) -> {Atom.to_string(key), value}
      {key, value} -> {key, value}
    end)
  end

  defp parse_observed_on(%Date{} = date), do: date

  defp parse_observed_on(value) when is_binary(value) do
    case Date.from_iso8601(value) do
      {:ok, date} -> date
      _ -> nil
    end
  end

  defp parse_observed_on(_), do: nil

  defp merge_payload(%Observation{} = observation, attrs) do
    attrs = stringify_keys(attrs)

    case Map.get(attrs, "payload") do
      incoming when is_map(incoming) ->
        Map.put(attrs, "payload", Map.merge(observation.payload || %{}, incoming))

      _ ->
        attrs
    end
  end

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
