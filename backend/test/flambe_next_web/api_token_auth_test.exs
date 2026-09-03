defmodule FlambeNextWeb.ApiTokenAuthTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, Traces}
  alias FlambeNext.Accounts.ApiTokens
  alias FlambeNextWeb.Endpoint

  test "stores only a hash and authenticates the raw token" do
    {:ok, user} = Accounts.create_user(%{name: "Agent User", username: "agent-user"})
    {:ok, api_token, raw_token} = ApiTokens.create(user, "Claude")

    assert String.starts_with?(raw_token, "flb_")
    refute api_token.token_hash == raw_token
    assert byte_size(api_token.token_hash) == 64
    assert {:ok, authenticated_user} = ApiTokens.authenticate(raw_token)
    assert authenticated_user.id == user.id
    assert {:error, :invalid_token} = ApiTokens.authenticate("flb_not-a-real-token")
  end

  test "bearer token authenticates API requests without a browser session", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Bearer User", username: "bearer-user"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Agent trace"})
    {:ok, _api_token, raw_token} = ApiTokens.create(user, "Codex")

    conn =
      conn
      |> put_req_header("authorization", "Bearer #{raw_token}")
      |> get(~p"/api/traces/#{trace.id}")

    assert %{"data" => %{"id" => trace_id, "name" => "Agent trace"}} = json_response(conn, 200)
    assert trace_id == trace.id
  end

  test "invalid bearer token is rejected", %{conn: conn} do
    conn =
      conn
      |> put_req_header("authorization", "Bearer flb_0000000000000000000000000000000000000000000")
      |> get(~p"/api/traces")

    assert %{"error" => "UNAUTHENTICATED"} = json_response(conn, 401)
  end

  test "reports recently successful bearer-token agents without counting the status poll", %{
    conn: conn
  } do
    {:ok, user} = Accounts.create_user(%{name: "Present Agent", username: "present-agent"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Presence trace"})
    {:ok, _api_token, raw_token} = ApiTokens.create(user, "Codex")
    {:ok, _second_api_token, second_raw_token} = ApiTokens.create(user, "Second agent")

    conn
    |> put_req_header("authorization", "Bearer #{raw_token}")
    |> get(~p"/api/traces/#{trace.id}")
    |> json_response(200)

    build_conn()
    |> put_req_header("authorization", "Bearer #{second_raw_token}")
    |> get(~p"/api/traces/#{trace.id}")
    |> json_response(200)

    conn =
      build_conn()
      |> put_req_header("authorization", "Bearer #{raw_token}")
      |> get(~p"/api/agent-status")

    assert json_response(conn, 200) == %{"active_agents" => 2}
  end

  test "bearer-authenticated activity writes broadcast live timeline events", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Streaming Agent", username: "streaming-agent"})
    {:ok, trace} = Traces.create_trace(user, %{name: "Streaming trace"})
    thread = trace.id |> Traces.get_trace!() |> Map.fetch!(:threads) |> List.first()
    {:ok, _api_token, raw_token} = ApiTokens.create(user, "Claude")

    :ok = Endpoint.subscribe("events:#{user.id}")

    conn =
      conn
      |> put_req_header("authorization", "Bearer #{raw_token}")
      |> post(~p"/api/activities", %{
        "trace_id" => trace.id,
        "thread_id" => thread.id,
        "activity" => %{"name" => "Inspect auth", "categories" => []},
        "event" => %{"timestamp_integer" => 1_788_360_000_000, "phase" => "B"}
      })

    assert %{"data" => %{"activity" => %{"id" => activity_id}}} = json_response(conn, 201)

    assert_receive %Phoenix.Socket.Broadcast{
      event: "timeline_event",
      payload: %{
        trace_id: trace_id,
        event: %{phase: "B", activity: %{id: ^activity_id, name: "Inspect auth"}}
      }
    }

    assert trace_id == trace.id
  end
end
