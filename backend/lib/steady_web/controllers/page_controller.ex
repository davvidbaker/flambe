defmodule SteadyWeb.PageController do
  use SteadyWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
