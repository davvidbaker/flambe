defmodule StitchWeb.TabsController do
  use StitchWeb, :controller

  alias Stitch.Accounts
  alias Stitch.Accounts.Tabs

  action_fallback(StitchWeb.FallbackController)

  def index(conn, _params) do
    tabs = Accounts.list_tabs()
    render(conn, "index.json", tabs: tabs)
  end

  def create(conn, %{"user_id" => user_id, "tabs" => tabs_params}) do
    with {:ok, %Tabs{} = tabs} <- Accounts.create_tabs(user_id, tabs_params) do
      StitchWeb.Endpoint.broadcast!("events:" <> Integer.to_string(user_id), "tabs", %{tabs_count: tabs.count, window_count: tabs.window_count, timestamp: tabs.timestamp_integer})

      conn
      |> put_status(:created)
      |> put_resp_header("location", tabs_path(conn, :show, tabs))
      |> render("show.json", tabs: tabs)
    end
  end

  def show(conn, %{"id" => id}) do
    tabs = Accounts.get_tabs!(id)
    render(conn, "show.json", tabs: tabs)
  end

  def update(conn, %{"id" => id, "tabs" => tabs_params}) do
    tabs = Accounts.get_tabs!(id)

    with {:ok, %Tabs{} = tabs} <- Accounts.update_tabs(tabs, tabs_params) do
      render(conn, "show.json", tabs: tabs)
    end
  end

  def delete(conn, %{"id" => id}) do
    tabs = Accounts.get_tabs!(id)

    with {:ok, %Tabs{}} <- Accounts.delete_tabs(tabs) do
      send_resp(conn, :no_content, "")
    end
  end
end
