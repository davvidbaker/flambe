defmodule FlambeNextWeb.AgentCommandContractTest do
  use FlambeNextWeb.ConnCase, async: false

  alias FlambeNext.{Accounts, Repo, Traces}
  alias FlambeNext.Accounts.ApiTokens

  @steps Path.expand("../../../test/agent-command-contract.json", __DIR__)
         |> File.read!()
         |> Jason.decode!()

  setup do
    credentials =
      for key <- ~w(OPENAI_API_KEY TYPESAFE_API_KEY), into: %{}, do: {key, System.get_env(key)}

    Enum.each(credentials, fn {key, _} -> System.delete_env(key) end)
    llm = Application.fetch_env(:flambe_next, :reducer_llm)
    Application.delete_env(:flambe_next, :reducer_llm)

    on_exit(fn ->
      Enum.each(credentials, fn {key, value} ->
        if value, do: System.put_env(key, value), else: System.delete_env(key)
      end)

      case llm do
        {:ok, value} -> Application.put_env(:flambe_next, :reducer_llm, value)
        :error -> Application.delete_env(:flambe_next, :reducer_llm)
      end
    end)

    {:ok, user} =
      Accounts.create_user(%{
        name: "Contract",
        username: "contract-#{System.unique_integer([:positive])}"
      })

    {:ok, trace} = Traces.create_trace(user, %{name: "Contract"})
    {:ok, _, token} = ApiTokens.create(user, "Contract")
    %{token: token, trace: Repo.preload(trace, :threads)}
  end

  for adapter <- [:rest, :mcp] do
    @adapter adapter
    test "#{adapter} returns a successful reducer message", context do
      decision =
        Jason.encode!(%{
          assessment: "on_track",
          direction: nil,
          reply: "Keep going",
          rationale: "Routine",
          actions: [%{type: "no_op"}]
        })

      Application.put_env(:flambe_next, :reducer_llm, fn _, _ -> {:ok, decision} end)

      arguments = %{
        "trace_id" => context.trace.id,
        "thread_id" => hd(context.trace.threads).id,
        "agent_id" => "contract-agent",
        "name" => "Contract work"
      }

      assert {:ok, started} = execute(@adapter, context.token, "start", arguments)

      assert {:ok, result} =
               execute(@adapter, context.token, "message", %{
                 "trace_id" => context.trace.id,
                 "activity_id" => started["activity_id"],
                 "agent_id" => "contract-agent",
                 "message" => "Making progress"
               })

      assert result["assessment"] == "on_track"
      assert result["reply"] == "Keep going"
      assert result["direction"] == nil
      assert result["actions_applied"] == [%{"type" => "no_op"}]
    end

    test "#{adapter} satisfies the shared command contract", context do
      Enum.reduce(@steps, nil, fn step, activity_id ->
        arguments =
          Map.new(step["arguments"], fn {key, value} ->
            {key, if(value == "$activity", do: activity_id, else: value)}
          end)

        arguments =
          Map.merge(
            %{
              "trace_id" => context.trace.id,
              "thread_id" => hd(context.trace.threads).id,
              "agent_id" => "contract-agent"
            },
            arguments
          )

        {outcome, result} = execute(@adapter, context.token, step["command"], arguments)

        if code = step["error"] do
          assert outcome == :error
          assert result["code"] == code
          activity_id
        else
          assert outcome == :ok
          if step["same_activity"], do: assert(result["activity_id"] == activity_id)
          activity_id = if step["capture"], do: result["activity_id"], else: activity_id
          if step["capture"], do: assert(is_integer(activity_id))

          if step["status"] || Map.has_key?(step, "visible") do
            activity = Enum.find(result["state"]["activities"], &(&1["id"] == activity_id))

            if step["visible"] == false,
              do: assert(is_nil(activity)),
              else: assert(activity["status"] == step["status"])
          end

          activity_id
        end
      end)
    end
  end

  defp execute(adapter, token, command, arguments) do
    conn =
      build_conn()
      |> put_req_header("authorization", "Bearer #{token}")
      |> put_req_header("content-type", "application/json")

    conn =
      case adapter do
        :rest ->
          post(
            conn,
            "/api/agent-commands",
            Jason.encode!(%{command: command, arguments: arguments})
          )

        :mcp ->
          conn
          |> put_req_header("accept", "application/json, text/event-stream")
          |> put_req_header("mcp-protocol-version", "2026-07-28")
          |> put_req_header("mcp-method", "tools/call")
          |> put_req_header("mcp-name", "flambe_#{command}")
          |> post(
            "/mcp",
            Jason.encode!(%{
              jsonrpc: "2.0",
              id: 1,
              method: "tools/call",
              params: %{
                name: "flambe_#{command}",
                arguments: arguments,
                _meta: %{
                  "io.modelcontextprotocol/protocolVersion" => "2026-07-28",
                  "io.modelcontextprotocol/clientInfo" => %{name: "contract", version: "1"},
                  "io.modelcontextprotocol/clientCapabilities" => %{}
                }
              }
            })
          )
      end

    body = Jason.decode!(conn.resp_body)

    case adapter do
      :rest ->
        if conn.status == 200, do: {:ok, body["data"]}, else: {:error, body["error"]}

      :mcp ->
        assert conn.status == 200
        assert is_map(body["result"])

        {if(body["result"]["isError"], do: :error, else: :ok),
         body["result"]["structuredContent"]}
    end
  end
end
