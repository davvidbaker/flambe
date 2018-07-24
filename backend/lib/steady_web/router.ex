defmodule SteadyWeb.Router do
  use SteadyWeb, :router
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
    plug(:fetch_cookies)
  end

  pipeline :authenticate_user do
    plug(Steady.AuthPipeline)
  end

  scope "/", SteadyWeb do
    # Use the default browser stack
    pipe_through([:browser, :authenticate_user])

    get("/", PageController, :index)
  end

  scope "/", SteadyWeb do
    pipe_through(:api)

    resources("/sessions", SessionController, only: [:create, :delete], singleton: true)
  end

  scope "/auth", SteadyWeb do
    pipe_through([:browser])
    get("/:provider", AuthController, :request)
    get("/:provider/callback", AuthController, :callback)
    post("/:provider/callback", AuthController, :callback)
    delete("/logout", AuthController, :delete)
  end

  # Other scopes may use custom stacks.
  scope "/api", SteadyWeb do
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
end
