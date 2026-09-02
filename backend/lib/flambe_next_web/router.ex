defmodule FlambeNextWeb.Router do
  use FlambeNextWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug :fetch_session
  end

  pipeline :authenticated_api do
    plug FlambeNextWeb.Plugs.RequireUser
    plug FlambeNextWeb.Plugs.TrackAgentPresence
  end

  pipeline :spa do
    plug :accepts, ["html"]
  end

  scope "/api", FlambeNextWeb do
    pipe_through :api

    get "/health", HealthController, :show
    post "/register", RegistrationController, :create
  end

  scope "/auth", FlambeNextWeb do
    pipe_through :api

    post "/identity/callback", AuthController, :identity_callback
    delete "/logout", AuthController, :logout
  end

  scope "/api", FlambeNextWeb do
    pipe_through [:api, :authenticated_api]

    resources "/traces", TraceController, only: [:index, :create, :show, :update, :delete]
    resources "/threads", ThreadController, only: [:create, :show, :update, :delete]
    resources "/categories", CategoryController, except: [:new, :edit]
    resources "/activities", ActivityController, only: [:create, :show, :update, :delete]
    resources "/events", EventController, only: [:create, :update, :delete]
    resources "/todos", TodoController, except: [:new, :edit]
    resources "/mantras", MantraController, except: [:new, :edit]
    resources "/attentions", AttentionController, except: [:new, :edit]
    resources "/tabs", TabController, except: [:new, :edit]
    resources "/search_terms", SearchTermController, except: [:new, :edit]
    get "/agent-status", AgentStatusController, :show
    get "/users/:id", UserController, :show
  end

  scope "/", FlambeNextWeb do
    pipe_through :spa

    get "/*path", SpaController, :index
  end
end
