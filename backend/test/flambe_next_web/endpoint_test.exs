defmodule FlambeNextWeb.EndpointTest do
  use FlambeNextWeb.ConnCase, async: true

  test "session cookies persist beyond a single browser process" do
    opts = FlambeNextWeb.Endpoint.session_options()

    assert opts[:store] == :cookie
    assert opts[:http_only] == true
    assert opts[:same_site] == "Lax"
    assert opts[:max_age] == 60 * 60 * 24 * 60
    assert is_boolean(opts[:secure])
  end

  test "serves distinct production and development favicons", %{conn: conn} do
    prod = get(conn, "/favicon.png")
    dev = get(build_conn(), "/favicon_dev.png")

    assert prod.status == 200
    assert dev.status == 200

    prod_file = Application.app_dir(:flambe_next, "priv/static/favicon.png")
    dev_file = Application.app_dir(:flambe_next, "priv/static/favicon_dev.png")

    assert File.read!(prod_file) != File.read!(dev_file)
  end
end
