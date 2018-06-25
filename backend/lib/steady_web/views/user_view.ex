defmodule SteadyWeb.UserView do
  use SteadyWeb, :view
  alias SteadyWeb.UserView

  def render("index.json", %{users: users}) do
    %{data: render_many(users, UserView, "user.json")}
  end

  def render("show.json", %{user: user, mantras: mantras}) do
    %{data: render_one(%{user: user, mantras: mantras}, UserView, "user.json")}
  end

  # ⚠️ things are getting a little messy. user is a map that has keys [:user, :mantras]
  def render("user.json", %{user: user}) do
    # ⚠️ this might not be how you're supposed to do this, email is really not part of the user, but the user credentials. This could be refactored.
    mantras = user.mantras
    user = Steady.Repo.preload(user.user, [:credential, :categories])

    # ⚠️ Is this where this should happen? I doubt it.
    traces = Steady.Traces.list_user_traces(user.id)
    todos = Steady.Accounts.list_user_todos(user.id)
    attentions = Steady.Accounts.list_user_attentions(user.id)
    search_terms = Steady.Accounts.list_user_search_terms(user.id)
    tabs = Steady.Accounts.list_user_tabs(user.id)

    categories =
      Enum.map(user.categories, fn cat ->
        %{
          id: cat.id,
          color_background: cat.color_background,
          color_text: cat.color_text,
          name: cat.name
        }
      end)

    %{
      id: user.id,
      name: user.name,
      # email: user.credential.email,
      traces: traces,
      categories: categories,
      todos: todos,
      mantras: mantras,
      attentionShifts: attentions,
      tabs: tabs,
      searchTerms: search_terms
    }
  end
end
