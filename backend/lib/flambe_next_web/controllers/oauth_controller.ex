defmodule FlambeNextWeb.OAuthController do
  use FlambeNextWeb, :controller

  alias FlambeNext.{Accounts, OAuth}

  def protected_resource(conn, _params) do
    json(conn, OAuth.protected_resource_metadata())
  end

  def authorization_server(conn, _params) do
    json(conn, OAuth.authorization_server_metadata())
  end

  def authorize(conn, params) do
    with {:ok, request} <- OAuth.validate_authorization_request(params) do
      case current_user(conn) do
        nil ->
          render_login(conn, request, nil)

        user ->
          if params["approve"] == "1" do
            code = OAuth.issue_code(user, request)
            redirect(conn, external: OAuth.oauth_success_redirect(request, code))
          else
            render_consent(conn, user, params, request)
          end
      end
    else
      {:error, :invalid_request} ->
        conn
        |> put_status(:bad_request)
        |> html("Invalid OAuth request")
    end
  end

  def authorize_login(conn, params) do
    oauth_params = Map.drop(params, ["email", "password", "_csrf_token"])

    with {:ok, request} <- OAuth.validate_authorization_request(oauth_params),
         {:ok, user} <- Accounts.authenticate_by_email_password(params["email"], params["password"]) do
      code = OAuth.issue_code(user, request)

      conn
      |> configure_session(renew: true)
      |> put_session(:user_id, user.id)
      |> redirect(external: OAuth.oauth_success_redirect(request, code))
    else
      {:error, :invalid_credentials} ->
        case OAuth.validate_authorization_request(oauth_params) do
          {:ok, request} -> render_login(conn, request, "Invalid email or password")
          _ -> conn |> put_status(:bad_request) |> html("Invalid OAuth request")
        end

      _ ->
        conn
        |> put_status(:bad_request)
        |> html("Invalid OAuth request")
    end
  end

  def token(conn, params) do
    case OAuth.exchange_code(params) do
      {:ok, token} ->
        conn
        |> put_resp_header("cache-control", "no-store")
        |> put_resp_header("pragma", "no-cache")
        |> json(token)

      {:error, :invalid_grant} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "invalid_grant"})
    end
  end

  defp current_user(conn) do
    case get_session(conn, :user_id) do
      nil -> nil
      id -> Accounts.get_user(id)
    end
  end

  defp render_consent(conn, user, raw_params, request) do
    approve_params =
      raw_params
      |> Map.drop(["approve"])
      |> Map.put("approve", "1")

    deny_url = OAuth.oauth_error_redirect(request, "access_denied")
    approve_url = "/oauth/authorize?" <> URI.encode_query(approve_params)

    html(
      conn,
      page(
        "Connect ChatGPT to Flambé",
        """
        <p>Signed in as <strong>#{h(user.username)}</strong>.</p>
        <p>ChatGPT is requesting access to read and update your Flambé work trace.</p>
        <div class="actions">
          <a class="primary" href="#{h(approve_url)}">Connect</a>
          <a href="#{h(deny_url)}">Cancel</a>
        </div>
        """
      )
    )
  end

  defp render_login(conn, request, error) do
    csrf = Plug.CSRFProtection.get_csrf_token()

    hidden =
      request
      |> Enum.reject(fn {_key, value} -> is_nil(value) end)
      |> Enum.map_join("\n", fn {key, value} ->
        ~s(<input type="hidden" name="#{h(key)}" value="#{h(value)}">)
      end)

    error_html = if error, do: ~s(<p class="error">#{h(error)}</p>), else: ""

    html(
      conn,
      page(
        "Sign in to connect ChatGPT",
        """
        #{error_html}
        <form method="post" action="/oauth/authorize">
          <input type="hidden" name="_csrf_token" value="#{h(csrf)}">
          #{hidden}
          <label>Email <input type="email" name="email" required autocomplete="email"></label>
          <label>Password <input type="password" name="password" required autocomplete="current-password"></label>
          <button type="submit">Sign in and connect</button>
        </form>
        """
      )
    )
  end

  defp page(title, body) do
    """
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>#{h(title)}</title>
        <style>
          :root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, sans-serif; }
          body { max-width: 34rem; margin: 4rem auto; padding: 0 1.25rem; line-height: 1.5; }
          form { display: grid; gap: 1rem; }
          label { display: grid; gap: .35rem; }
          input { font: inherit; padding: .7rem; border: 1px solid #8887; border-radius: .45rem; }
          button, a { font: inherit; }
          button, .primary { border: 0; border-radius: .45rem; padding: .7rem 1rem; background: #e87524; color: white; text-decoration: none; cursor: pointer; }
          .actions { display: flex; gap: .75rem; align-items: center; margin-top: 1.25rem; }
          .error { color: #c33; }
        </style>
      </head>
      <body>
        <h1>#{h(title)}</h1>
        #{body}
      </body>
    </html>
    """
  end

  defp h(value) do
    value
    |> to_string()
    |> Phoenix.HTML.html_escape()
    |> Phoenix.HTML.safe_to_string()
  end
end
