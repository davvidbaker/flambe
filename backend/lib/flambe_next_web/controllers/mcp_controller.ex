defmodule FlambeNextWeb.McpController do
  use FlambeNextWeb, :controller

  alias FlambeNext.ReducerAgent

  @protocol_version "2026-07-28"
  @tool_name "flambe_message"

  def handle(conn, params) do
    with :ok <- validate_protocol_headers(conn, params),
         {:ok, response} <- dispatch(conn.assigns.current_user, params) do
      json(conn, response)
    else
      {:error, :header_mismatch} ->
        conn
        |> put_status(:bad_request)
        |> json(rpc_error(params["id"], -32020, "MCP headers do not match the request body"))

      {:error, :invalid_request} ->
        conn
        |> put_status(:bad_request)
        |> json(rpc_error(params["id"], -32600, "Invalid MCP request"))

      {:error, :method_not_found} ->
        json(conn, rpc_error(params["id"], -32601, "Method not found"))
    end
  end

  defp dispatch(_user, %{"jsonrpc" => "2.0", "id" => id, "method" => "server/discover"}) do
    {:ok,
     rpc_result(id, %{
       protocolVersion: @protocol_version,
       serverInfo: %{name: "flambe", version: "0.1.0"},
       capabilities: %{tools: %{}}
     })}
  end

  # Legacy discovery is cheap to support and makes the endpoint usable by clients that
  # have not moved to the stateless 2026 protocol yet.
  defp dispatch(_user, %{"jsonrpc" => "2.0", "id" => id, "method" => "initialize"}) do
    {:ok,
     rpc_result(id, %{
       protocolVersion: @protocol_version,
       serverInfo: %{name: "flambe", version: "0.1.0"},
       capabilities: %{tools: %{}}
     })}
  end

  defp dispatch(_user, %{"jsonrpc" => "2.0", "id" => id, "method" => "tools/list"}) do
    {:ok,
     rpc_result(id, %{
       tools: [tool_definition()],
       ttlMs: 300_000,
       cacheScope: "private"
     })}
  end

  defp dispatch(user, %{
         "jsonrpc" => "2.0",
         "id" => id,
         "method" => "tools/call",
         "params" => %{"name" => @tool_name, "arguments" => arguments}
       })
       when is_map(arguments) do
    case call_reducer(user, arguments) do
      {:ok, result} ->
        {:ok,
         rpc_result(id, %{
           content: reducer_content(result),
           structuredContent: result,
           isError: false
         })}

      {:error, :not_found} ->
        {:ok, tool_error(id, "The trace or activity does not exist in this flame")}

      {:error, :invalid_input} ->
        {:ok, tool_error(id, "trace_id, activity_id, and a non-empty message are required")}

      {:error, :reducer_not_configured} ->
        {:ok, tool_error(id, "Reducer Agent is not configured: OPENAI_API_KEY is missing")}

      {:error, reason} ->
        {:ok, tool_error(id, "Reducer Agent failed: #{inspect(reason)}")}
    end
  end

  defp dispatch(_user, %{"jsonrpc" => "2.0", "id" => _id, "method" => "tools/call"}) do
    {:error, :method_not_found}
  end

  # Legacy clients can send this notification after initialize. Notifications have no response.
  # Phoenix still needs an HTTP response, so return a JSON-RPC-shaped empty success.
  defp dispatch(_user, %{"jsonrpc" => "2.0", "method" => "notifications/initialized"}) do
    {:ok, %{}}
  end

  defp dispatch(_user, _params), do: {:error, :invalid_request}

  # Keep the external-model runtime completely off the normal/local-only startup path.
  # We only start OTP's HTTP client after an explicitly configured reducer is invoked.
  defp call_reducer(user, arguments) do
    case System.get_env("OPENAI_API_KEY") do
      nil ->
        {:error, :reducer_not_configured}

      "" ->
        {:error, :reducer_not_configured}

      _api_key ->
        case Application.ensure_all_started(:inets) do
          {:ok, _apps} -> ReducerAgent.handle(user, arguments)
          {:error, reason} -> {:error, {:reducer_http_runtime_failed, reason}}
        end
    end
  end

  defp tool_definition do
    %{
      name: @tool_name,
      title: "Message the Flambe Reducer Agent",
      description:
        "Report a meaningful work update to the Reducer Agent. It preserves the global intent of the current flame, may make small stack changes, and may return an authoritative direction. If a direction is returned, follow it before continuing work.",
      inputSchema: %{
        type: "object",
        additionalProperties: false,
        properties: %{
          trace_id: %{type: "integer", minimum: 1, description: "Current flame/trace id"},
          activity_id: %{type: "integer", minimum: 1, description: "Current activity id"},
          agent_id: %{type: "string", description: "Stable worker/session identifier when available"},
          message: %{
            type: "string",
            minLength: 1,
            description:
              "Concise update: discovery, blocker, proposed scope change, completion signal, or concern that work may be drifting"
          }
        },
        required: ["trace_id", "activity_id", "message"]
      }
    }
  end

  defp reducer_content(%{direction: direction, reply: reply}) do
    text = reply || direction_text(direction)

    if text do
      [%{type: "text", text: text}]
    else
      [%{type: "text", text: "OK"}]
    end
  end

  defp direction_text(nil), do: nil
  defp direction_text(direction), do: "Direction: #{direction}"

  defp tool_error(id, message) do
    rpc_result(id, %{
      content: [%{type: "text", text: message}],
      isError: true
    })
  end

  defp rpc_result(id, result), do: %{jsonrpc: "2.0", id: id, result: result}

  defp rpc_error(id, code, message) do
    %{jsonrpc: "2.0", id: id, error: %{code: code, message: message}}
  end

  defp validate_protocol_headers(conn, %{"method" => method} = params) do
    version = header(conn, "mcp-protocol-version")
    header_method = header(conn, "mcp-method")
    header_name = header(conn, "mcp-name")
    body_name = get_in(params, ["params", "name"])

    # No modern headers means this is a legacy MCP request. The 2026 protocol requires
    # all routing headers, so once any are present we validate them strictly.
    if is_nil(version) and is_nil(header_method) and is_nil(header_name) do
      :ok
    else
      cond do
        version != @protocol_version -> {:error, :header_mismatch}
        header_method != method -> {:error, :header_mismatch}
        method == "tools/call" and header_name != body_name -> {:error, :header_mismatch}
        method != "tools/call" and not is_nil(header_name) -> {:error, :header_mismatch}
        true -> :ok
      end
    end
  end

  defp validate_protocol_headers(_conn, _params), do: {:error, :invalid_request}

  defp header(conn, name) do
    case get_req_header(conn, name) do
      [value] -> value
      _ -> nil
    end
  end
end
