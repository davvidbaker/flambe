defmodule FlambeNextWeb.SpaController do
  use FlambeNextWeb, :controller

  def index(conn, _params) do
    index_path = Application.app_dir(:flambe_next, "priv/static/assets/index.html")

    if File.regular?(index_path) do
      conn
      |> put_resp_content_type("text/html")
      |> send_file(200, index_path)
    else
      conn
      |> put_status(:service_unavailable)
      |> json(%{error: "FRONTEND_NOT_BUILT"})
    end
  end
end
