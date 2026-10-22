defmodule FlambeNextWeb.AgentControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.Accounts.ApiTokens
  alias FlambeNext.{Accounts, Agents, Repo, Traces}

  setup do
    {:ok, user} =
      Accounts.create_user(%{
        name: "Presence User",
        username: "presence-user-#{System.unique_integer([:positive])}"
      })

    %{user: user}
  end

  test "lists only the signed-in user's agents with their last contact", %{conn: conn, user: user} do
    {:ok, %{agent: agent}} = Agents.identify(user, "codex:shared", "My Agent", "Codex")
    last_seen_at = DateTime.add(DateTime.utc_now(:second), -3600)
    agent |> Ecto.Changeset.change(last_seen_at: last_seen_at) |> Repo.update!()

    {:ok, other} =
      Accounts.create_user(%{
        name: "Other Presence User",
        username: "other-presence-user-#{System.unique_integer([:positive])}"
      })

    {:ok, _} = Agents.identify(other, "codex:shared", "Other Agent", "Codex")

    response = conn |> authenticated_as(user) |> get(~p"/api/agents")

    assert json_response(response, 200) == %{
             "data" => [
               %{
                 "agent_id" => "codex:shared",
                 "name" => "My Agent",
                 "platform" => "Codex",
                 "last_seen_at" => DateTime.to_iso8601(last_seen_at)
               }
             ]
           }

    assert Agents.get(user, "codex:shared").last_seen_at == last_seen_at
  end

  test "returns an empty list before the user has any identified agents", %{
    conn: conn,
    user: user
  } do
    conn = conn |> authenticated_as(user) |> get(~p"/api/agents")
    assert json_response(conn, 200) == %{"data" => []}
  end

  test "requires authentication", %{conn: conn} do
    conn = get(conn, ~p"/api/agents")
    assert json_response(conn, 401) == %{"error" => "UNAUTHENTICATED"}
  end

  test "an identified API command refreshes the contact visible to the dashboard", %{
    conn: conn,
    user: user
  } do
    {:ok, trace} = Traces.create_trace(user, %{name: "Presence trace"})
    {:ok, _token, raw_token} = ApiTokens.create(user, "Presence test")
    {:ok, %{agent: agent}} = Agents.identify(user, "codex:command", "Command Agent", "Codex")
    previous_contact = DateTime.add(DateTime.utc_now(:second), -3600)
    agent |> Ecto.Changeset.change(last_seen_at: previous_contact) |> Repo.update!()
    before_request = DateTime.utc_now(:second)

    command_response =
      conn
      |> put_req_header("authorization", "Bearer #{raw_token}")
      |> put_req_header("x-flambe-agent-id", "codex:command")
      |> post(~p"/api/agent-commands", %{
        "command" => "status",
        "arguments" => %{"trace_id" => trace.id}
      })

    assert json_response(command_response, 200)["data"]

    response = build_conn() |> authenticated_as(user) |> get(~p"/api/agents")
    assert [listed_agent] = json_response(response, 200)["data"]
    assert {:ok, contact, 0} = DateTime.from_iso8601(listed_agent["last_seen_at"])
    assert DateTime.compare(contact, before_request) in [:eq, :gt]
    assert DateTime.compare(contact, previous_contact) == :gt

    dashboard_response = build_conn() |> authenticated_as(user) |> get(~p"/api/users/#{user}")
    assert json_response(dashboard_response, 200)["data"]["agents"] == [listed_agent]
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
