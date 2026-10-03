defmodule FlambeNextWeb.OpenAIAppsChallengeController do
  use FlambeNextWeb, :controller

  def show(conn, _params) do
    case System.get_env("OPENAI_APPS_CHALLENGE_TOKEN") do
      token when is_binary(token) and token != "" ->
        conn
        |> put_resp_content_type("text/plain")
        |> send_resp(:ok, token)

      _ ->
        send_resp(conn, :not_found, "challenge token not configured")
    end
  end
end
