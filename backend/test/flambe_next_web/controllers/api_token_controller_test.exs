defmodule FlambeNextWeb.ApiTokenControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.Accounts
  alias FlambeNext.Accounts.ApiTokens
  alias FlambeNext.Traces

  test "lists, creates, and revokes session-owned tokens without echoing stored hashes", %{
    conn: conn
  } do
    {:ok, user} = Accounts.create_user(%{name: "Token User", username: "token-user"})
    {:ok, _existing, _raw} = ApiTokens.create(user, "Existing")

    conn = conn |> authenticated_as(user) |> get(~p"/api/api-tokens")
    assert %{"data" => [%{"name" => "Existing", "id" => existing_id}]} = json_response(conn, 200)
    refute json_response(conn, 200)["data"] |> hd() |> Map.has_key?("raw_token")
    refute json_response(conn, 200)["data"] |> hd() |> Map.has_key?("token_hash")

    conn =
      conn
      |> recycle()
      |> authenticated_as(user)
      |> post(~p"/api/api-tokens", %{"api_token" => %{"name" => "Claude"}})

    assert %{
             "data" => %{
               "id" => created_id,
               "name" => "Claude",
               "raw_token" => "flb_" <> _ = raw_token,
               "last_used_at" => nil
             }
           } = json_response(conn, 201)

    refute created_id == existing_id
    assert String.starts_with?(raw_token, "flb_")

    conn =
      conn |> recycle() |> authenticated_as(user) |> delete(~p"/api/api-tokens/#{created_id}")

    assert response(conn, 204) == ""

    conn = conn |> recycle() |> authenticated_as(user) |> get(~p"/api/api-tokens")
    assert %{"data" => [%{"id" => ^existing_id, "name" => "Existing"}]} = json_response(conn, 200)
  end

  test "does not list another user's tokens", %{conn: conn} do
    {:ok, owner} = Accounts.create_user(%{name: "Owner", username: "token-owner"})
    {:ok, other} = Accounts.create_user(%{name: "Other", username: "token-other"})
    {:ok, _api_token, _raw} = ApiTokens.create(owner, "Secret")

    conn = conn |> authenticated_as(other) |> get(~p"/api/api-tokens")
    assert json_response(conn, 200) == %{"data" => []}
  end

  test "records last_used_at on bearer authentication", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Bearer Touch", username: "bearer-touch"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Touch trace"})
    {:ok, api_token, raw_token} = ApiTokens.create(user, "Codex")
    assert api_token.last_used_at == nil

    conn
    |> put_req_header("authorization", "Bearer #{raw_token}")
    |> get(~p"/api/traces/#{trace.id}")
    |> json_response(200)

    conn =
      conn
      |> recycle()
      |> authenticated_as(user)
      |> get(~p"/api/api-tokens")

    assert %{"data" => [%{"id" => id, "last_used_at" => last_used_at}]} = json_response(conn, 200)
    assert id == api_token.id
    assert is_binary(last_used_at)
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
