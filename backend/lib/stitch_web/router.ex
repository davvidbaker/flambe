defmodule StitchWeb.Router do
  use StitchWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
    plug :fetch_session    
  end

  scope "/", StitchWeb do
    pipe_through :browser # Use the default browser stack

    get "/", PageController, :index
  end

  scope "/", StitchWeb do
    pipe_through :api

    resources "/sessions", SessionController, only: [:new, :create, :delete], singleton: true    
  end

  scope "/cms", StitchWeb.CMS, as: :cms do
    pipe_through [:browser, :authenticate_user]

    resources "/pages", PageController
  end

  defp authenticate_user(conn, _) do
    case get_session(conn, :user_id) do
      nil ->
        conn
        # ⚠️ fix for production
        |> put_resp_header("access-control-allow-origin", "*")
        |> put_status(:unauthorized)
        |> Phoenix.Controller.json(%{"error": "SESSION_NOT_FOUND"})
        |> halt()
      user_id ->
        assign(conn, :current_user, Stitch.Accounts.get_user!(user_id))
    end
  end

  # Other scopes may use custom stacks.
  scope "/api", StitchWeb do
    pipe_through [:api] # ⚠️ add authentication in eventually..., :authenticate_user]
    
    resources "/users", UserController, except: [:new, :edit]
    resources "/traces", TraceController, except: [:new, :edit]
    resources "/events", EventController, only: [:create]
    resources "/activities", ActivityController, only: [:create]
    resources "/categories", CategoryController, except: [:new, :edit]
    resources "/threads", ThreadController, except: [:new, :edit]
    
    # resources "/events" EventController, only: [:new]
  end
end
