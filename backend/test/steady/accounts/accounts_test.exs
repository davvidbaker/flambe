defmodule Steady.AccountsTest do
  use Steady.DataCase

  alias Steady.{Accounts, TestHelper}

  describe "users" do
    alias Steady.Accounts.User

    @valid_attrs %{email: "some email", name: "some name"}
    @update_attrs %{email: "some updated email", name: "some updated name"}
    @invalid_attrs %{email: nil, name: nil}

    def user_fixture(attrs \\ %{}) do
      {:ok, user} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Accounts.create_user()

      user
    end

    test "list_users/0 returns all users" do
      user = user_fixture()

      assert Enum.map(Accounts.list_users(), fn x -> x.id end) ==
               Enum.map([user], fn x -> x.id end)
    end

    test "get_user!/1 returns the user with given id" do
      user = user_fixture()
      assert Accounts.get_user!(user.id).id == user.id
    end

    test "create_user/1 with valid data creates a user" do
      assert {:ok, %User{} = user} = Accounts.create_user(@valid_attrs)
      assert user.name == "some name"
    end

    test "create_user/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Accounts.create_user(@invalid_attrs)
    end

    test "update_user/2 with valid data updates the user" do
      user = user_fixture()
      assert {:ok, user} = Accounts.update_user(user, @update_attrs)
      assert %User{} = user
      # ⚠️ should do some testing with credential and email
      # assert user.credential.email == "some updated email"
      assert user.name == "some updated name"
    end

    test "update_user/2 with invalid data returns error changeset" do
      user = user_fixture()
      assert {:error, %Ecto.Changeset{}} = Accounts.update_user(user, @invalid_attrs)
      assert user.id == Accounts.get_user!(user.id).id
    end

    test "delete_user/1 deletes the user" do
      user = user_fixture()
      assert {:ok, %User{}} = Accounts.delete_user(user)
      assert_raise Ecto.NoResultsError, fn -> Accounts.get_user!(user.id) end
    end

    test "change_user/1 returns a user changeset" do
      user = user_fixture()
      assert %Ecto.Changeset{} = Accounts.change_user(user)
    end
  end

  describe "credentials" do
    alias Steady.Accounts.Credential

    @valid_attrs %{email: "some email"}
    @update_attrs %{email: "some updated email"}
    @invalid_attrs %{email: nil}

    def credential_fixture(attrs \\ @valid_attrs) do
      # ⚠️ right now you can't reall create a credential separate from a user
      {:ok, user} = Accounts.create_user(%{name: "dummy name", credential: attrs})
      %Accounts.User{:credential => credential} = user

      credential
    end

    test "list_credentials/0 returns all credentials" do
      credential = credential_fixture()
      assert Accounts.list_credentials() == [credential]
    end

    test "get_credential!/1 returns the credential with given id" do
      credential = credential_fixture()
      assert Accounts.get_credential!(credential.id) == credential
    end

    test "create_credential/1 with valid data creates a credential" do
      assert {:ok, %Credential{} = credential} = {:ok, credential_fixture()}
      assert credential.email == "some email"
    end

    test "create_credential/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Accounts.create_credential(@invalid_attrs)
    end

    test "update_credential/2 with valid data updates the credential" do
      credential = credential_fixture()
      assert {:ok, credential} = Accounts.update_credential(credential, @update_attrs)
      assert %Credential{} = credential
      assert credential.email == "some updated email"
    end

    test "update_credential/2 with invalid data returns error changeset" do
      credential = credential_fixture()
      assert {:error, %Ecto.Changeset{}} = Accounts.update_credential(credential, @invalid_attrs)
      assert credential == Accounts.get_credential!(credential.id)
    end

    test "delete_credential/1 deletes the credential" do
      credential = credential_fixture()
      assert {:ok, %Credential{}} = Accounts.delete_credential(credential)
      assert_raise Ecto.NoResultsError, fn -> Accounts.get_credential!(credential.id) end
    end

    test "change_credential/1 returns a credential changeset" do
      credential = credential_fixture()
      assert %Ecto.Changeset{} = Accounts.change_credential(credential)
    end
  end

  describe "categories" do
    alias Steady.Accounts.Category

    @valid_attrs %{color: "some color", name: "some name"}
    @update_attrs %{color: "some updated color", name: "some updated name"}
    @invalid_attrs %{color: nil, name: nil}

    def category_fixture(attrs \\ %{}) do
      {:ok, category} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Accounts.create_category()

      category
    end

    test "list_categories/0 returns all categories" do
      category = category_fixture()
      assert Accounts.list_categories() == [category]
    end

    test "get_category!/1 returns the category with given id" do
      category = category_fixture()
      assert Accounts.get_category!(category.id) == category
    end

    test "create_category/1 with valid data creates a category" do
      assert {:ok, %Category{} = category} = Accounts.create_category(@valid_attrs)
      assert category.color == "some color"
      assert category.name == "some name"
    end

    test "create_category/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Accounts.create_category(@invalid_attrs)
    end

    test "update_category/2 with valid data updates the category" do
      category = category_fixture()
      assert {:ok, category} = Accounts.update_category(category, @update_attrs)
      assert %Category{} = category
      assert category.color == "some updated color"
      assert category.name == "some updated name"
    end

    test "update_category/2 with invalid data returns error changeset" do
      category = category_fixture()
      assert {:error, %Ecto.Changeset{}} = Accounts.update_category(category, @invalid_attrs)
      assert category == Accounts.get_category!(category.id)
    end

    test "delete_category/1 deletes the category" do
      category = category_fixture()
      assert {:ok, %Category{}} = Accounts.delete_category(category)
      assert_raise Ecto.NoResultsError, fn -> Accounts.get_category!(category.id) end
    end

    test "change_category/1 returns a category changeset" do
      category = category_fixture()
      assert %Ecto.Changeset{} = Accounts.change_category(category)
    end
  end

  describe "todos" do
    alias Steady.Accounts.Todo

    @valid_attrs %{description: "some description", name: "some name"}
    @update_attrs %{description: "some updated description", name: "some updated name"}
    @invalid_attrs %{description: nil, name: nil}

    def todo_fixture(attrs \\ %{}) do
      {:ok, todo} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Accounts.create_todo()

      todo
    end

    test "list_todos/0 returns all todos" do
      todo = todo_fixture()
      assert Accounts.list_todos() == [todo]
    end

    test "get_todo!/1 returns the todo with given id" do
      todo = todo_fixture()
      assert Accounts.get_todo!(todo.id) == todo
    end

    test "create_todo/1 with valid data creates a todo" do
      assert {:ok, %Todo{} = todo} = Accounts.create_todo(@valid_attrs)
      assert todo.description == "some description"
      assert todo.name == "some name"
    end

    test "create_todo/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Accounts.create_todo(@invalid_attrs)
    end

    test "update_todo/2 with valid data updates the todo" do
      todo = todo_fixture()
      assert {:ok, todo} = Accounts.update_todo(todo, @update_attrs)
      assert %Todo{} = todo
      assert todo.description == "some updated description"
      assert todo.name == "some updated name"
    end

    test "update_todo/2 with invalid data returns error changeset" do
      todo = todo_fixture()
      assert {:error, %Ecto.Changeset{}} = Accounts.update_todo(todo, @invalid_attrs)
      assert todo == Accounts.get_todo!(todo.id)
    end

    test "delete_todo/1 deletes the todo" do
      todo = todo_fixture()
      assert {:ok, %Todo{}} = Accounts.delete_todo(todo)
      assert_raise Ecto.NoResultsError, fn -> Accounts.get_todo!(todo.id) end
    end

    test "change_todo/1 returns a todo changeset" do
      todo = todo_fixture()
      assert %Ecto.Changeset{} = Accounts.change_todo(todo)
    end
  end

  describe "mantras" do
    alias Steady.Accounts.Mantra

    @valid_attrs %{name: "some name"}
    @update_attrs %{name: "some updated name"}
    @invalid_attrs %{name: nil}

    def mantra_fixture(attrs \\ %{}) do
      {:ok, mantra} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Accounts.create_mantra()

      mantra
    end

    test "list_mantras/0 returns all mantras" do
      mantra = mantra_fixture()
      assert Accounts.list_mantras() == [mantra]
    end

    test "get_mantra!/1 returns the mantra with given id" do
      mantra = mantra_fixture()
      assert Accounts.get_mantra!(mantra.id) == mantra
    end

    test "create_mantra/1 with valid data creates a mantra" do
      assert {:ok, %Mantra{} = mantra} = Accounts.create_mantra(@valid_attrs)
      assert mantra.name == "some name"
    end

    test "create_mantra/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Accounts.create_mantra(@invalid_attrs)
    end

    test "update_mantra/2 with valid data updates the mantra" do
      mantra = mantra_fixture()
      assert {:ok, mantra} = Accounts.update_mantra(mantra, @update_attrs)
      assert %Mantra{} = mantra
      assert mantra.name == "some updated name"
    end

    test "update_mantra/2 with invalid data returns error changeset" do
      mantra = mantra_fixture()
      assert {:error, %Ecto.Changeset{}} = Accounts.update_mantra(mantra, @invalid_attrs)
      assert mantra == Accounts.get_mantra!(mantra.id)
    end

    test "delete_mantra/1 deletes the mantra" do
      mantra = mantra_fixture()
      assert {:ok, %Mantra{}} = Accounts.delete_mantra(mantra)
      assert_raise Ecto.NoResultsError, fn -> Accounts.get_mantra!(mantra.id) end
    end

    test "change_mantra/1 returns a mantra changeset" do
      mantra = mantra_fixture()
      assert %Ecto.Changeset{} = Accounts.change_mantra(mantra)
    end
  end

  describe "attentions" do
    alias Steady.Accounts.Attention

    @valid_attrs %{}
    @update_attrs %{}
    @invalid_attrs %{}

    def attention_fixture(attrs \\ %{}) do
      {:ok, attention} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Accounts.create_attention()

      attention
    end

    test "list_attentions/0 returns all attentions" do
      attention = attention_fixture()
      assert Accounts.list_attentions() == [attention]
    end

    test "get_attention!/1 returns the attention with given id" do
      attention = attention_fixture()
      assert Accounts.get_attention!(attention.id) == attention
    end

    test "create_attention/1 with valid data creates a attention" do
      assert {:ok, %Attention{} = attention} = Accounts.create_attention(@valid_attrs)
    end

    test "create_attention/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Accounts.create_attention(@invalid_attrs)
    end

    test "update_attention/2 with valid data updates the attention" do
      attention = attention_fixture()
      assert {:ok, attention} = Accounts.update_attention(attention, @update_attrs)
      assert %Attention{} = attention
    end

    test "update_attention/2 with invalid data returns error changeset" do
      attention = attention_fixture()
      assert {:error, %Ecto.Changeset{}} = Accounts.update_attention(attention, @invalid_attrs)
      assert attention == Accounts.get_attention!(attention.id)
    end

    test "delete_attention/1 deletes the attention" do
      attention = attention_fixture()
      assert {:ok, %Attention{}} = Accounts.delete_attention(attention)
      assert_raise Ecto.NoResultsError, fn -> Accounts.get_attention!(attention.id) end
    end

    test "change_attention/1 returns a attention changeset" do
      attention = attention_fixture()
      assert %Ecto.Changeset{} = Accounts.change_attention(attention)
    end
  end

  describe "tabs" do
    alias Steady.Accounts.Tabs

    @valid_attrs %{count: 42}
    @update_attrs %{count: 43}
    @invalid_attrs %{count: nil}

    def tabs_fixture(attrs \\ %{}) do
      {:ok, tabs} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Accounts.create_tabs()

      tabs
    end

    test "list_tabs/0 returns all tabs" do
      tabs = tabs_fixture()
      assert Accounts.list_tabs() == [tabs]
    end

    test "get_tabs!/1 returns the tabs with given id" do
      tabs = tabs_fixture()
      assert Accounts.get_tabs!(tabs.id) == tabs
    end

    test "create_tabs/1 with valid data creates a tabs" do
      assert {:ok, %Tabs{} = tabs} = Accounts.create_tabs(@valid_attrs)
      assert tabs.count == 42
    end

    test "create_tabs/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Accounts.create_tabs(@invalid_attrs)
    end

    test "update_tabs/2 with valid data updates the tabs" do
      tabs = tabs_fixture()
      assert {:ok, tabs} = Accounts.update_tabs(tabs, @update_attrs)
      assert %Tabs{} = tabs
      assert tabs.count == 43
    end

    test "update_tabs/2 with invalid data returns error changeset" do
      tabs = tabs_fixture()
      assert {:error, %Ecto.Changeset{}} = Accounts.update_tabs(tabs, @invalid_attrs)
      assert tabs == Accounts.get_tabs!(tabs.id)
    end

    test "delete_tabs/1 deletes the tabs" do
      tabs = tabs_fixture()
      assert {:ok, %Tabs{}} = Accounts.delete_tabs(tabs)
      assert_raise Ecto.NoResultsError, fn -> Accounts.get_tabs!(tabs.id) end
    end

    test "change_tabs/1 returns a tabs changeset" do
      tabs = tabs_fixture()
      assert %Ecto.Changeset{} = Accounts.change_tabs(tabs)
    end
  end

  describe "searches" do
    alias Steady.Accounts.Searches

    @valid_attrs %{term: "some term", timestamp: "2010-04-17 14:00:00.000000Z"}
    @update_attrs %{term: "some updated term", timestamp: "2011-05-18 15:01:01.000000Z"}
    @invalid_attrs %{term: nil, timestamp: nil}

    def searches_fixture(attrs \\ %{}) do
      {:ok, searches} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Accounts.create_searches()

      searches
    end

    test "list_searches/0 returns all searches" do
      searches = searches_fixture()
      assert Accounts.list_searches() == [searches]
    end

    test "get_searches!/1 returns the searches with given id" do
      searches = searches_fixture()
      assert Accounts.get_searches!(searches.id) == searches
    end

    test "create_searches/1 with valid data creates a searches" do
      assert {:ok, %Searches{} = searches} = Accounts.create_searches(@valid_attrs)
      assert searches.term == "some term"

      assert searches.timestamp ==
               DateTime.from_naive!(~N[2010-04-17 14:00:00.000000Z], "Etc/UTC")
    end

    test "create_searches/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Accounts.create_searches(@invalid_attrs)
    end

    test "update_searches/2 with valid data updates the searches" do
      searches = searches_fixture()
      assert {:ok, searches} = Accounts.update_searches(searches, @update_attrs)
      assert %Searches{} = searches
      assert searches.term == "some updated term"

      assert searches.timestamp ==
               DateTime.from_naive!(~N[2011-05-18 15:01:01.000000Z], "Etc/UTC")
    end

    test "update_searches/2 with invalid data returns error changeset" do
      searches = searches_fixture()
      assert {:error, %Ecto.Changeset{}} = Accounts.update_searches(searches, @invalid_attrs)
      assert searches == Accounts.get_searches!(searches.id)
    end

    test "delete_searches/1 deletes the searches" do
      searches = searches_fixture()
      assert {:ok, %Searches{}} = Accounts.delete_searches(searches)
      assert_raise Ecto.NoResultsError, fn -> Accounts.get_searches!(searches.id) end
    end

    test "change_searches/1 returns a searches changeset" do
      searches = searches_fixture()
      assert %Ecto.Changeset{} = Accounts.change_searches(searches)
    end
  end
end
