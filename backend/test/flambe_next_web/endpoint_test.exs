defmodule FlambeNextWeb.EndpointTest do
  use ExUnit.Case, async: true

  test "session cookies persist beyond a single browser process" do
    opts = FlambeNextWeb.Endpoint.session_options()

    assert opts[:store] == :cookie
    assert opts[:http_only] == true
    assert opts[:same_site] == "Lax"
    assert opts[:max_age] == 60 * 60 * 24 * 60
    assert is_boolean(opts[:secure])
  end
end
