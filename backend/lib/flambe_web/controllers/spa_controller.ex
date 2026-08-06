defmodule FlambeWeb.SpaController do
  use FlambeWeb, :controller

  @vite_index Application.app_dir(:flambe, "priv/static/assets/index.html")

  def index(conn, _params) do
    if File.regular?(@vite_index) do
      conn
      |> put_resp_content_type("text/html")
      |> send_file(200, @vite_index)
    else
      send_resp(conn, 503, "Vite assets are missing. Run npm run build:vite in frontend.")
    end
  end
end
