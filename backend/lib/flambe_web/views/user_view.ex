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
    user = Flambe.Repo.preload(user.user, [:credentials, :categories])

    traces = Flambe.Traces.list_user_traces(user)
    # |> Enum.map(fn trace ->
    #   %{id: trace.id, name: trace.name}
    # end)

    todos = Flambe.Accounts.list_user_todos(user.id)
    attentions = Flambe.Accounts.list_user_attentions(user.id)
    search_terms = Flambe.Accounts.list_user_search_terms(user.id)
    tabs = Flambe.Accounts.list_user_tabs(user.id)

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
