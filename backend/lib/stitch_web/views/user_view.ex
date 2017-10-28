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
      user_with_email = Stitch.Repo.preload(user, :credential)
      %{id: user_with_email.id,
        name: user_with_email.name,
        email: user_with_email.credential.email}
    end

end
