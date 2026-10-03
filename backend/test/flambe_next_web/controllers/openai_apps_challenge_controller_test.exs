defmodule FlambeNextWeb.OpenAIAppsChallengeControllerTest do
  use FlambeNextWeb.ConnCase, async: false

  setup do
    previous = System.get_env("OPENAI_APPS_CHALLENGE_TOKEN")

    on_exit(fn ->
      case previous do
        nil -> System.delete_env("OPENAI_APPS_CHALLENGE_TOKEN")
        value -> System.put_env("OPENAI_APPS_CHALLENGE_TOKEN", value)
      end
    end)

    :ok
  end

  test "returns 404 when the challenge token is not configured", %{conn: conn} do
    System.delete_env("OPENAI_APPS_CHALLENGE_TOKEN")

    conn = get(conn, "/.well-known/openai-apps-challenge")

    assert response(conn, 404) == "challenge token not configured"
  end

  test "serves the exact configured challenge token as plain text", %{conn: conn} do
    System.put_env("OPENAI_APPS_CHALLENGE_TOKEN", "openai-test-token")

    conn = get(conn, "/.well-known/openai-apps-challenge")

    assert response(conn, 200) == "openai-test-token"
    assert get_resp_header(conn, "content-type") == ["text/plain; charset=utf-8"]
  end
end
