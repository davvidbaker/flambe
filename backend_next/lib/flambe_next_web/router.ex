defmodule FlambeNextWeb.Router do
  use FlambeNextWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug :fetch_session
  end

  pipeline :authenticated_api do
    plug FlambeNextWeb.Plugs.RequireUser
  end

  scope "/api", FlambeNextWeb do
    pipe_through :api

    get "/health", HealthController, :show
  end

  scope "/auth", FlambeNextWeb do
    pipe_through :api

    post "/identity/callback", AuthController, :identity_callback
  end

  scope "/api", FlambeNextWeb do
    pipe_through [:api, :authenticated_api]

    resources "/traces", TraceController, only: [:index, :create, :show, :update, :delete]
    resources "/threads", ThreadController, only: [:create, :show, :update, :delete]
    post "/activities", ActivityController, :create
    post "/events", EventController, :create
  end
end
