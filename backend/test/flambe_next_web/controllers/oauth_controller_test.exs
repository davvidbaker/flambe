defmodule FlambeNextWeb.OAuthControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, OAuth, Traces}

  test "publishes MCP OAuth metadata", %{conn: conn} do
    resource =
      conn
      |> put_req_header("accept", "application/json")
      |> get(~p"/.well-known/oauth-protected-resource")
      |> json_response(200)

    assert resource["resource"] == OAuth.resource()
    assert resource["authorization_servers"] == [OAuth.issuer()]
    assert "flambe:read" in resource["scopes_supported"]
    assert "flambe:write" in resource["scopes_supported"]

    authorization =
      build_conn()
      |> put_req_header("accept", "application/json")
      |> get(~p"/.well-known/oauth-authorization-server")
      |> json_response(200)

    assert authorization["issuer"] == OAuth.issuer()
    assert authorization["authorization_endpoint"] == OAuth.issuer() <> "/oauth/authorize"
    assert authorization["token_endpoint"] == OAuth.issuer() <> "/oauth/token"
    assert authorization["code_challenge_methods_supported"] == ["S256"]
    assert authorization["authorization_response_iss_parameter_supported"]
  end

  test "authorization code plus PKCE mints a bearer token accepted by MCP", %{conn: conn} do
    {:ok, user} =
      Accounts.register_user(%{
        name: "Plugin User",
        username: "plugin-user",
        credentials: [%{email: "plugin@example.com", password: "password123"}]
      })

    {:ok, _trace} = Traces.create_trace(user, %{name: "Plugin trace"})

    verifier = String.duplicate("v", 48)

    challenge =
      verifier
      |> then(&:crypto.hash(:sha256, &1))
      |> Base.url_encode64(padding: false)

    redirect_uri = "https://chatgpt.com/connector_platform_oauth_redirect"

    authorize_params = %{
      "response_type" => "code",
      "client_id" => "https://chatgpt.com/oauth/client.json",
      "redirect_uri" => redirect_uri,
      "code_challenge" => challenge,
      "code_challenge_method" => "S256",
      "resource" => OAuth.resource(),
      "scope" => "flambe:read flambe:write",
      "state" => "state-123",
      "approve" => "1"
    }

    authorized =
      conn
      |> init_test_session(%{user_id: user.id})
      |> put_req_header("accept", "text/html")
      |> get("/oauth/authorize?" <> URI.encode_query(authorize_params))

    [location] = get_resp_header(authorized, "location")
    uri = URI.parse(location)
    returned = URI.decode_query(uri.query)

    assert returned["state"] == "state-123"
    assert returned["iss"] == OAuth.issuer()
    assert is_binary(returned["code"])

    token_response =
      build_conn()
      |> put_req_header("accept", "application/json")
      |> post(~p"/oauth/token", %{
        "grant_type" => "authorization_code",
        "code" => returned["code"],
        "code_verifier" => verifier,
        "client_id" => "https://chatgpt.com/oauth/client.json",
        "redirect_uri" => redirect_uri,
        "resource" => OAuth.resource()
      })
      |> json_response(200)

    assert token_response["token_type"] == "Bearer"
    assert token_response["scope"] == "flambe:read flambe:write"
    assert String.starts_with?(token_response["access_token"], "flb_")

    mcp =
      build_conn()
      |> put_req_header("authorization", "Bearer " <> token_response["access_token"])
      |> put_req_header("accept", "application/json, text/event-stream")
      |> put_req_header("content-type", "application/json")
      |> post(
        "/mcp",
        Jason.encode!(%{
          "jsonrpc" => "2.0",
          "id" => 1,
          "method" => "initialize",
          "params" => %{
            "protocolVersion" => "2025-11-25",
            "capabilities" => %{},
            "clientInfo" => %{"name" => "oauth-test", "version" => "1"}
          }
        })
      )

    assert %{
             "result" => %{
               "serverInfo" => %{"name" => "flambe"}
             }
           } = json_response(mcp, 200)
  end

  test "MCP authentication challenge points ChatGPT at protected resource metadata", %{conn: conn} do
    response =
      conn
      |> put_req_header("accept", "application/json, text/event-stream")
      |> put_req_header("content-type", "application/json")
      |> post(
        "/mcp",
        Jason.encode!(%{
          "jsonrpc" => "2.0",
          "id" => 1,
          "method" => "tools/list",
          "params" => %{}
        })
      )

    assert response.status == 401
    [challenge] = get_resp_header(response, "www-authenticate")
    assert challenge =~ "/.well-known/oauth-protected-resource"
    assert challenge =~ "flambe:read flambe:write"
  end
end
