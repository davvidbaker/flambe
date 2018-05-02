defmodule FlambeWeb.Router do
  use FlambeWeb, :router
  require Ueberauth

  pipeline :browser do
    plug(Ueberauth)
    plug(:accepts, ["html"])
    plug(:fetch_session)
    plug(:fetch_flash)
    plug(:protect_from_forgery)
    plug(:put_secure_browser_headers)
  end

  pipeline :api do
    plug(:accepts, ["json"])
    plug(:fetch_session)
  end

  pipeline :authenticate_user do
    # plug(Flambe.AuthPipeline)
  end

  scope "/", FlambeWeb do
    # Use the default browser stack
    pipe_through([:browser, :authenticate_user])

    get("/", PageController, :index)
  end

  scope "/", FlambeWeb do
    pipe_through(:api)

    resources("/sessions", SessionController, only: [:new, :create, :delete], singleton: true)
  end

  scope "/cms", FlambeWeb.CMS, as: :cms do
    pipe_through([:browser, :authenticate_user])

    resources("/pages", PageController)
  end

  scope "/auth", FlambeWeb do
    pipe_through([:browser])

    get("/:provider", AuthController, :request)
    get("/:provider/callback", AuthController, :callback)
    post("/:provider/callback", AuthController, :callback)
    delete("/logout", AuthController, :delete)
  end

  # Other scopes may use custom stacks.
  scope "/api", FlambeWeb do
    # ⚠️ add authentication in eventually..., :authenticate_user]
    pipe_through([:api, :authenticate_user])

    resources("/users", UserController, except: [:new, :edit])
    resources("/traces", TraceController, except: [:new, :edit])
    resources("/events", EventController, only: [:create])
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
