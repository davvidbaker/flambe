defmodule FlambeNext.OAuth do
  @moduledoc false

  alias FlambeNext.Accounts
  alias FlambeNext.Accounts.ApiTokens
  alias FlambeNextWeb.Endpoint

  @code_salt "flambe-oauth-code-v1"
  @code_max_age_seconds 300
  @read_scope "flambe:read"
  @write_scope "flambe:write"

  def issuer, do: Endpoint.url()
  def resource, do: issuer() <> "/mcp"
  def scopes, do: [@read_scope, @write_scope]

  def protected_resource_metadata do
    %{
      resource: resource(),
      authorization_servers: [issuer()],
      scopes_supported: scopes(),
      resource_documentation: issuer()
    }
  end

  def authorization_server_metadata do
    %{
      issuer: issuer(),
      authorization_endpoint: issuer() <> "/oauth/authorize",
      token_endpoint: issuer() <> "/oauth/token",
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: scopes(),
      authorization_response_iss_parameter_supported: true
    }
  end

  def validate_authorization_request(params) when is_map(params) do
    with "code" <- Map.get(params, "response_type"),
         client_id when is_binary(client_id) <- present(params["client_id"]),
         true <- allowed_client_id?(client_id),
         redirect_uri when is_binary(redirect_uri) <- present(params["redirect_uri"]),
         true <- allowed_redirect_uri?(redirect_uri),
         challenge when is_binary(challenge) <- present(params["code_challenge"]),
         "S256" <- Map.get(params, "code_challenge_method"),
         requested_resource when is_binary(requested_resource) <- present(params["resource"]),
         true <- requested_resource == resource() do
      scope = normalize_scope(params["scope"])

      {:ok,
       %{
         client_id: client_id,
         redirect_uri: redirect_uri,
         code_challenge: challenge,
         resource: requested_resource,
         scope: scope,
         state: params["state"]
       }}
    else
      _ -> {:error, :invalid_request}
    end
  end

  def issue_code(user, request) do
    payload = %{
      user_id: user.id,
      client_id: request.client_id,
      redirect_uri: request.redirect_uri,
      code_challenge: request.code_challenge,
      resource: request.resource,
      scope: request.scope
    }

    Phoenix.Token.sign(Endpoint, @code_salt, payload)
  end

  def exchange_code(params) when is_map(params) do
    with "authorization_code" <- Map.get(params, "grant_type"),
         code when is_binary(code) <- present(params["code"]),
         verifier when is_binary(verifier) <- present(params["code_verifier"]),
         client_id when is_binary(client_id) <- present(params["client_id"]),
         redirect_uri when is_binary(redirect_uri) <- present(params["redirect_uri"]),
         requested_resource when is_binary(requested_resource) <- present(params["resource"]),
         {:ok, payload} <-
           Phoenix.Token.verify(Endpoint, @code_salt, code, max_age: @code_max_age_seconds),
         true <- payload.client_id == client_id,
         true <- payload.redirect_uri == redirect_uri,
         true <- payload.resource == requested_resource,
         true <- valid_pkce?(verifier, payload.code_challenge),
         %{} = user <- Accounts.get_user(payload.user_id),
         {:ok, _api_token, raw_token} <- ApiTokens.create(user, "ChatGPT plugin") do
      {:ok,
       %{
         access_token: raw_token,
         token_type: "Bearer",
         scope: payload.scope
       }}
    else
      _ -> {:error, :invalid_grant}
    end
  end

  def oauth_error_redirect(request, error) do
    query =
      %{
        error: error,
        iss: issuer()
      }
      |> maybe_put(:state, request.state)
      |> URI.encode_query()

    request.redirect_uri <> "?" <> query
  end

  def oauth_success_redirect(request, code) do
    query =
      %{
        code: code,
        iss: issuer()
      }
      |> maybe_put(:state, request.state)
      |> URI.encode_query()

    request.redirect_uri <> "?" <> query
  end

  defp normalize_scope(nil), do: Enum.join(scopes(), " ")

  defp normalize_scope(scope) when is_binary(scope) do
    requested =
      scope
      |> String.split(~r/\s+/, trim: true)
      |> Enum.filter(&(&1 in scopes()))
      |> Enum.uniq()

    case requested do
      [] -> Enum.join(scopes(), " ")
      values -> Enum.join(values, " ")
    end
  end

  defp normalize_scope(_), do: Enum.join(scopes(), " ")

  defp valid_pkce?(verifier, challenge) do
    derived =
      verifier
      |> then(&:crypto.hash(:sha256, &1))
      |> Base.url_encode64(padding: false)

    byte_size(derived) == byte_size(challenge) and Plug.Crypto.secure_compare(derived, challenge)
  end

  defp allowed_client_id?(client_id) do
    case URI.parse(client_id) do
      %URI{scheme: "https", host: "chatgpt.com", path: path} when is_binary(path) ->
        String.starts_with?(path, "/oauth/")

      _ ->
        false
    end
  end

  defp allowed_redirect_uri?(redirect_uri) do
    case URI.parse(redirect_uri) do
      %URI{scheme: "https", host: "chatgpt.com"} -> true
      _ -> false
    end
  end

  defp present(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      trimmed -> trimmed
    end
  end

  defp present(_), do: nil

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)
end
