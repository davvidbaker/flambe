defmodule FlambeWeb.PageController do
  use FlambeWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
