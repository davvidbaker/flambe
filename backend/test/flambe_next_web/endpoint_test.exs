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

  test "serves PWA install assets at the site root", %{conn: conn} do
    manifest = get(conn, "/manifest.webmanifest")
    service_worker = get(conn, "/sw.js")
    apple_icon = get(conn, "/apple-touch-icon.png")
    icon_192 = get(conn, "/pwa-192.png")
    icon_512 = get(conn, "/pwa-512.png")

    assert manifest.status == 200
    assert service_worker.status == 200
    assert apple_icon.status == 200
    assert icon_192.status == 200
    assert icon_512.status == 200

    body = Jason.decode!(manifest.resp_body)
    assert body["display"] == "standalone"
    assert body["start_url"] == "/?source=pwa"
    assert body["scope"] == "/"
    assert Enum.any?(body["icons"], &(&1["src"] == "/pwa-192.png"))
  end
end
