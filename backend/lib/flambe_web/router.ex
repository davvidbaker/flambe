defmodule FlambeWeb.Router do
  use FlambeWeb, :router
  require Ueberauth

  pipeline :browser do
    plug(Ueberauth)
    plug(:accepts, ["html"])
    plug(:fetch_session)
    plug(:fetch_flash)
    plug(:protect_from_forgery)
  end

  pipeline :api do
    plug(:accepts, ["json"])
    plug(:fetch_session)
    plug(:fetch_cookies)
  end

  pipeline :authenticate_user do
    plug(Flambe.AuthPipeline)
  end

  scope "/", FlambeWeb do
    pipe_through(:api)

    resources("/sessions", SessionController, only: [:create, :delete], singleton: true)
  end

  scope "/auth", FlambeWeb do
    pipe_through([:api])
    # ⚠️ this might be unsafe?
    # actually I don't even need this if I i'm using the api pipeline, right?
    # 🤔 is it ok to use the api pipeline for all these auth endpoints?
    get("/get-csrf-token", AuthController, :get_csrf)

    post("/identity/callback", AuthController, :identity_callback)
    get("/:provider", AuthController, :request)
    get("/:provider/callback", AuthController, :callback)
    post("/:provider/callback", AuthController, :callback)
    delete("/logout", AuthController, :delete)
  end

  # Other scopes may use custom stacks.
  scope "/api", FlambeWeb do
    pipe_through(:api)

    post("/register", UserController, :register)
  end

  scope "/api", FlambeWeb do
    # ⚠️ add authentication in eventually..., :authenticate_user]
    pipe_through([:api, :authenticate_user])

    resources("/users", UserController, except: [:new, :edit])
    resources("/traces", TraceController, except: [:new, :edit])
    resources("/events", EventController, only: [:create, :update])
    resources("/activities", ActivityController, only: [:create, :show, :delete, :update])
    resources("/categories", CategoryController, except: [:new, :edit])
    resources("/threads", ThreadController, except: [:new, :edit])
    resources("/todos", TodoController, except: [:new, :edit])
    resources("/mantras", MantraController, except: [:new, :edit])
    resources("/attentions", AttentionController, except: [:new, :edit])
    resources("/tabs", TabsController, except: [:new, :edit])
    resources("/search_terms", SearchTermController, except: [:new, :edit])
    # resources "/events" EventController, only: [:new]
  end

  # Keep this last so it only handles browser routes. API, authentication, and
  # Channel endpoints retain their existing route contracts.
  scope "/", FlambeWeb do
    pipe_through(:browser)

    get("/*path", SpaController, :index)
  end
end
