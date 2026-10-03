defmodule FlambeNextWeb.Plugs.RequireApiToken do
  @moduledoc """
  Authenticates external agent endpoints with a Flambe API token.

  Unlike `RequireUser`, this plug deliberately ignores browser sessions.
  """

  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  alias FlambeNext.Accounts.ApiTokens

  def init(options), do: options

  def call(conn, _options) do
    with ["Bearer " <> raw_token] <- get_req_header(conn, "authorization"),
         {:ok, user, api_token} <- ApiTokens.authenticate_with_token(raw_token) do
      ApiTokens.touch_last_used(api_token)

      conn
      |> assign(:current_user, user)
      |> assign(:api_token, api_token)
    else
      _ ->
        resource_metadata = FlambeNextWeb.Endpoint.url() <> "/.well-known/oauth-protected-resource"

        conn
        |> put_resp_header(
          "www-authenticate",
          ~s(Bearer resource_metadata="#{resource_metadata}", scope="flambe:read flambe:write")
        )
        |> put_status(:unauthorized)
        |> json(%{error: "UNAUTHENTICATED"})
        |> halt()
    end
  end
end
