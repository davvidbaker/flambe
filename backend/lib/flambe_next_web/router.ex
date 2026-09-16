defmodule FlambeNextWeb.Router do
  use FlambeNextWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug :fetch_session
  end

  pipeline :authenticated_api do
    plug FlambeNextWeb.Plugs.RequireUser
    plug FlambeNextWeb.Plugs.TrackAgentPresence
    plug FlambeNextWeb.Plugs.AgentIdentity
  end

  pipeline :spa do
    plug :accepts, ["html"]
  end

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :authenticated_browser do
    plug FlambeNextWeb.Plugs.RequireBrowserUser
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
    put "/traces/:id/thread_order", TraceController, :reorder_threads
    resources "/threads", ThreadController, only: [:create, :show, :update, :delete]
    resources "/categories", CategoryController, except: [:new, :edit]
    resources "/activities", ActivityController, only: [:create, :show, :update, :delete]
    resources "/events", EventController, only: [:create, :update, :delete]
    resources "/todos", TodoController, except: [:new, :edit]
    resources "/mantras", MantraController, except: [:new, :edit]
    resources "/attentions", AttentionController, except: [:new, :edit]
    resources "/tabs", TabController, except: [:new, :edit]
    resources "/search_terms", SearchTermController, except: [:new, :edit]
    resources "/observations", ObservationController, except: [:new, :edit]
    get "/agents/me", AgentController, :me
    get "/agent-status", AgentStatusController, :show
    get "/agent-status/stream", AgentStatusStreamController, :show
    get "/agent-commands", AgentCommandController, :index
    post "/agent-commands", AgentCommandController, :create
    post "/imports", ImportController, :create
    get "/users/:id", UserController, :show
    resources "/api-tokens", ApiTokenController, only: [:index, :create, :delete]
  end

  # MCP is agent-facing rather than part of the browser API namespace. Reuse the same
  # bearer-token authentication Flambe already exposes for external agents.
  scope "/", FlambeNextWeb do
    pipe_through [:api, :authenticated_api]

    get "/mcp", McpController, :unsupported
    post "/mcp", McpController, :handle
    delete "/mcp", McpController, :unsupported
  end

  scope "/", FlambeNextWeb do
    pipe_through [:browser, :authenticated_browser]

    get "/settings/categories", CategorySettingsController, :index
    post "/settings/categories", CategorySettingsController, :create
    put "/settings/categories/:id", CategorySettingsController, :update
    delete "/settings/categories/:id", CategorySettingsController, :delete
  end

  scope "/", FlambeNextWeb do
    pipe_through :spa

    get "/*path", SpaController, :index
  end
end
