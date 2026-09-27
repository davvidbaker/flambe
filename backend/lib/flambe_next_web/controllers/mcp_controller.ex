defmodule FlambeNextWeb.McpController do
  use FlambeNextWeb, :controller

  alias FlambeNext.AgentCommands
  alias FlambeNextWeb.AgentCommandController

  @protocol_version "2026-07-28"
  @legacy_protocol_versions ~w(2025-11-25 2025-06-18 2025-03-26 2024-11-05)
  @tools ~w(flambe_start flambe_end flambe_suspend flambe_resume flambe_status flambe_message flambe_plan)

  def unsupported(conn, _params), do: send_resp(conn, :method_not_allowed, "")

  def handle(conn, params) do
    with :ok <- validate_origin(conn),
         :ok <- validate_protocol_headers(conn, params),
         {:ok, response} <- dispatch(conn, params) do
      case response do
        :notification -> send_resp(conn, :accepted, "")
        body -> json(conn, body)
      end
    else
      {:error, :invalid_origin} ->
        conn
        |> put_status(:forbidden)
        |> json(rpc_error(Map.get(params, "id"), -32600, "Invalid Origin header"))

      {:error, :header_mismatch} ->
        conn
        |> put_status(:bad_request)
        |> json(
          rpc_error(Map.get(params, "id"), -32600, "MCP headers do not match the request body")
        )

      {:error, :invalid_request} ->
        conn
        |> put_status(:bad_request)
        |> json(rpc_error(Map.get(params, "id"), -32600, "Invalid MCP request"))

      {:error, :invalid_params} ->
        json(conn, rpc_error(Map.get(params, "id"), -32602, "Invalid method parameters"))

      {:error, :method_not_found} ->
        json(conn, rpc_error(Map.get(params, "id"), -32601, "Method not found"))
    end
  end

  defp dispatch(_conn, %{"jsonrpc" => "2.0", "id" => id, "method" => "server/discover"})
       when not is_nil(id) do
    {:ok,
     rpc_result(id, %{
       protocolVersion: @protocol_version,
       serverInfo: server_info(),
       capabilities: %{tools: %{}}
     })}
  end

  defp dispatch(_conn, %{
         "jsonrpc" => "2.0",
         "id" => id,
         "method" => "initialize",
         "params" => %{"protocolVersion" => requested}
       })
       when not is_nil(id) and is_binary(requested) do
    negotiated =
      if requested in @legacy_protocol_versions,
        do: requested,
        else: List.first(@legacy_protocol_versions)

    {:ok,
     rpc_result(id, %{
       protocolVersion: negotiated,
       serverInfo: server_info(),
       capabilities: %{tools: %{listChanged: false}}
     })}
  end

  defp dispatch(_conn, %{"jsonrpc" => "2.0", "id" => id, "method" => "tools/list"})
       when not is_nil(id) do
    {:ok,
     rpc_result(id, %{
       tools: Enum.map(@tools, &tool_definition/1),
       ttlMs: 300_000,
       cacheScope: "private"
     })}
  end

  defp dispatch(_conn, %{"jsonrpc" => "2.0", "id" => id, "method" => "ping"})
       when not is_nil(id),
       do: {:ok, rpc_result(id, %{})}

  defp dispatch(_conn, %{"jsonrpc" => "2.0", "id" => id, "method" => "initialize"})
       when not is_nil(id),
       do: {:error, :invalid_params}

  defp dispatch(conn, %{
         "jsonrpc" => "2.0",
         "id" => id,
         "method" => "tools/call",
         "params" => %{"name" => "flambe_" <> command, "arguments" => arguments}
       })
       when not is_nil(id) and command in ~w(start end suspend resume status message plan) and
              is_map(arguments) do
    arguments = AgentCommandController.put_agent_identity(conn, arguments)

    case AgentCommands.execute(conn.assigns.current_user, command, arguments) do
      {:ok, result} -> {:ok, rpc_result(id, tool_result(result))}
      {:error, reason} -> {:ok, rpc_result(id, tool_error(reason))}
    end
  end

  defp dispatch(_conn, %{"jsonrpc" => "2.0", "id" => id, "method" => "tools/call"})
       when not is_nil(id),
       do: {:error, :invalid_params}

  defp dispatch(_conn, %{"jsonrpc" => "2.0", "id" => id, "method" => _method})
       when not is_nil(id),
       do: {:error, :method_not_found}

  defp dispatch(_conn, %{"jsonrpc" => "2.0", "method" => _method} = params) do
    if Map.has_key?(params, "id"), do: {:error, :invalid_request}, else: {:ok, :notification}
  end

  defp dispatch(_conn, _params), do: {:error, :invalid_request}

  defp tool_definition("flambe_start") do
    tool(
      "flambe_start",
      "Start a Flambe Activity",
      "Start work in a flame. Omit parent_id to infer this agent's active parent, or pass null to start at the thread root. The reducer may rewrite the proposal (re-parent, rename, or resume an existing activity) and reports it in actions_applied; the result may also carry direction and reply. Act on a direction before continuing. Includes thread state and recommended availableActions.",
      common_properties()
      |> Map.merge(%{
        name: %{type: "string", minLength: 1, maxLength: 255, description: "Activity name"},
        description: %{type: "string", description: "Optional activity details"},
        thread_id: positive_integer("Thread id; defaults to the flame's default thread"),
        parent_id: %{
          oneOf: [%{type: "integer", minimum: 1}, %{type: "null"}],
          description: "Parent activity id; omit to infer for this agent, null for a root"
        },
        category_ids: %{type: "array", items: %{type: "integer", minimum: 1}},
        timestamp: timestamp_schema()
      }),
      ["trace_id", "name"]
    )
  end

  defp tool_definition("flambe_end") do
    lifecycle_tool(
      "flambe_end",
      "End a Flambe Activity",
      "End completed work. A message records a resolution (phase V); omitting it is a plain end (phase E). Open children must be closed first unless force is true; forced results list closed descendants. The result may carry direction and reply, and actions_applied lists any reducer rewrites; act on a direction before continuing. State availableActions are recommendations for the next command.",
      %{force: %{type: "boolean", default: false, description: "Also close open descendants"}}
    )
  end

  defp tool_definition("flambe_suspend") do
    lifecycle_tool(
      "flambe_suspend",
      "Suspend a Flambe Activity",
      "Suspend work that is explicitly being tabled. The result may carry direction and reply, and actions_applied lists any reducer rewrites; act on a direction before continuing. The returned state includes recommended availableActions.",
      %{}
    )
  end

  defp tool_definition("flambe_resume") do
    lifecycle_tool(
      "flambe_resume",
      "Resume a Flambe Activity",
      "Resume suspended work. The result may carry direction and reply, and actions_applied lists any reducer rewrites; act on a direction before continuing. The returned state includes recommended availableActions.",
      %{}
    )
  end

  defp tool_definition("flambe_status") do
    tool(
      "flambe_status",
      "Read Flambe State",
      "Read the activity stack and per-thread recommended availableActions without changing it.",
      common_properties()
      |> Map.merge(%{
        thread_id: positive_integer("Optional thread id to focus state and availableActions"),
        active_only: %{type: "boolean", default: false},
        suspended_only: %{type: "boolean", default: false},
        include_unstarted: %{
          type: "boolean",
          default: false,
          description: "Include unstarted activities. Omitted, status leaves them out."
        }
      }),
      ["trace_id"]
    )
  end

  defp tool_definition("flambe_plan") do
    tool(
      "flambe_plan",
      "Plan an unstarted Flambe activity",
      "Create an activity before it begins. Omit both times for limbo, or pass scheduled_start and scheduled_end as millisecond timestamps. The reducer places a new root on a thread. Beginning it later is flambe_start with the same name, or with activity_id.",
      common_properties()
      |> Map.merge(%{
        name: %{type: "string", minLength: 1, maxLength: 255, description: "Activity name"},
        description: %{type: "string"},
        weight: %{type: "integer", minimum: 0},
        scheduled_start: timestamp_schema(),
        scheduled_end: timestamp_schema(),
        category_ids: %{type: "array", items: %{type: "integer", minimum: 1}}
      }),
      ["trace_id", "name"]
    )
  end

  defp tool_definition("flambe_message") do
    tool(
      "flambe_message",
      "Message the Flambe Reducer Agent",
      "Report a meaningful update to the Reducer Agent. It may recommend direction and, when allowed, make one stack change. Follow a returned direction before continuing.",
      common_properties()
      |> Map.merge(%{
        activity_id: positive_integer("Activity id; omit to infer this agent's active activity"),
        message: %{type: "string", minLength: 1, description: "Concise work update or question"},
        allow_stack_changes: %{
          type: "boolean",
          default: true,
          description: "Set false for advice only"
        }
      }),
      ["trace_id", "message"]
    )
  end

  defp lifecycle_tool(name, title, description, extras) do
    properties =
      common_properties()
      |> Map.merge(%{
        activity_id: positive_integer("Activity id"),
        message: %{type: "string", description: "Optional outcome or transition note"},
        timestamp: timestamp_schema(),
        force: %{
          type: "boolean",
          default: false,
          description: "For end, also close open descendants"
        }
      })
      |> Map.merge(extras)

    tool(name, title, description, properties, ["trace_id", "activity_id"])
  end

  defp tool(name, title, description, properties, required) do
    %{
      name: name,
      title: title,
      description: description,
      inputSchema: %{
        type: "object",
        additionalProperties: false,
        properties: properties,
        required: required
      }
    }
  end

  defp common_properties do
    %{
      trace_id: positive_integer("Flame/trace id"),
      agent_id: %{type: "string", minLength: 1, maxLength: 200, description: "Stable agent id"},
      agent_name: %{
        type: "string",
        minLength: 1,
        maxLength: 200,
        description: "Agent display name"
      },
      platform: %{
        type: "string",
        minLength: 1,
        maxLength: 100,
        description: "Agent host product, for example Codex or Cursor Cloud"
      }
    }
  end

  defp positive_integer(description), do: %{type: "integer", minimum: 1, description: description}

  defp timestamp_schema do
    %{
      type: "integer",
      description: "Optional event time as Unix milliseconds"
    }
  end

  defp tool_result(result) do
    %{
      content: [%{type: "text", text: result_text(result)}],
      structuredContent: result,
      isError: false
    }
  end

  defp tool_error(reason) do
    {code, message, details} = command_error(reason)
    structured = %{code: code, message: message} |> Map.merge(details)

    %{
      content: [%{type: "text", text: message}],
      structuredContent: structured,
      isError: true
    }
  end

  defp command_error(:not_found),
    do: {"NOT_FOUND", "The requested resource was not found", %{}}

  defp command_error({:invalid_input, message}), do: {"INVALID_INPUT", message, %{}}

  defp command_error({:open_children, children}),
    do:
      {"OPEN_CHILDREN",
       "The activity has open children. End descendants first or use force: true",
       %{open_children: children}}

  defp command_error(:reducer_not_configured),
    do: {"REDUCER_NOT_CONFIGURED", "The Reducer Agent is not configured", %{}}

  defp command_error(_reason), do: {"COMMAND_FAILED", "The agent command failed", %{}}

  defp result_text(result), do: Jason.encode!(result)

  defp server_info, do: %{name: "flambe", version: "0.1.0"}
  defp rpc_result(id, result), do: %{jsonrpc: "2.0", id: id, result: result}

  defp rpc_error(id, code, message),
    do: %{jsonrpc: "2.0", id: id, error: %{code: code, message: message}}

  defp validate_origin(conn) do
    case get_req_header(conn, "origin") do
      [] -> :ok
      [origin] -> if URI.parse(origin).host == conn.host, do: :ok, else: {:error, :invalid_origin}
      _ -> {:error, :invalid_origin}
    end
  end

  defp validate_protocol_headers(conn, %{"method" => method} = params) do
    version = header(conn, "mcp-protocol-version")
    header_method = header(conn, "mcp-method")
    header_name = header(conn, "mcp-name")
    body_name = get_in(params, ["params", "name"])

    cond do
      version == @protocol_version ->
        validate_routing_headers(method, body_name, header_method, header_name)

      is_nil(version) or version in @legacy_protocol_versions ->
        validate_optional_routing_headers(method, body_name, header_method, header_name)

      true ->
        {:error, :header_mismatch}
    end
  end

  defp validate_protocol_headers(_conn, _params), do: {:error, :invalid_request}

  defp validate_routing_headers(method, body_name, method, header_name) do
    if method == "tools/call" do
      if header_name == body_name, do: :ok, else: {:error, :header_mismatch}
    else
      if is_nil(header_name), do: :ok, else: {:error, :header_mismatch}
    end
  end

  defp validate_routing_headers(_method, _body_name, _header_method, _header_name),
    do: {:error, :header_mismatch}

  defp validate_optional_routing_headers(method, body_name, header_method, header_name) do
    cond do
      not is_nil(header_method) and header_method != method -> {:error, :header_mismatch}
      not is_nil(header_name) and header_name != body_name -> {:error, :header_mismatch}
      true -> :ok
    end
  end

  defp header(conn, name) do
    case get_req_header(conn, name) do
      [value] -> value
      _ -> nil
    end
  end
end
