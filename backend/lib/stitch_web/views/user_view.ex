defmodule StitchWeb.UserView do
  use StitchWeb, :view
  alias StitchWeb.UserView
  
    def render("index.json", %{users: users}) do
      %{data: render_many(users, UserView, "user.json")}
    end
  
    def render("show.json", %{user: user}) do
      %{data: render_one(user, UserView, "user.json")}
    end
    
    def render("user.json", %{user: user}) do
      # ⚠️ this might not be how you're supposed to do this, email is really not part of the user, but the user credentials. This could be refactored.
      user = Stitch.Repo.preload(user, [:credential, :categories])

      # ⚠️ Is this where this should happen? I doubt it.
      traces = Stitch.Traces.list_user_traces(user.id);

      categories = Enum.map(user.categories, fn cat -> %{id: cat.id, color: cat.color, name: cat.name} end)
      
      %{id: user.id,
        name: user.name,
        email: user.credential.email,
        traces: traces,
        categories: categories
      }
    end

end
