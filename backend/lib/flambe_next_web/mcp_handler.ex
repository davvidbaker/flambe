defmodule FlambeNextWeb.MCPHandler do
  @moduledoc false

  use ExMCP.Server.Handler

  alias FlambeNext.{AgentCommandIdentity, AgentCommands}

  @tools ~w(flambe_start flambe_end flambe_suspend flambe_resume flambe_status flambe_message flambe_plan)

  @impl GenServer
  def init(%{user: user} = context), do: {:ok, Map.put(context, :user, user)}

  @impl ExMCP.Server.Handler
  def handle_initialize(params, state) do
    {:ok,
     %{
       protocolVersion: params["protocolVersion"],
       serverInfo: %{name: "flambe", version: "0.1.0"},
       capabilities: %{tools: %{listChanged: false}}
     }, state}
  end

  @impl ExMCP.Server.Handler
  def handle_list_tools(_cursor, state) do
    {:ok, Enum.map(@tools, &tool_definition/1), nil, state}
  end

  @impl ExMCP.Server.Handler
  def handle_call_tool("flambe_" <> command, arguments, state)
      when command in ~w(start end suspend resume status message plan) and is_map(arguments) do
    arguments =
      AgentCommandIdentity.merge(arguments, state.agent, Map.get(state, :platform?, false))

    result =
      case AgentCommands.execute(state.user, command, arguments) do
        {:ok, command_result} -> tool_result(command_result)
        {:error, reason} -> tool_error(reason)
      end

    {:ok, result, state}
  end

  def handle_call_tool(name, _arguments, state) do
    {:error, ExMCP.Error.protocol_error(-32602, "Unknown tool: #{name}"), state}
  end

  defp tool_definition("flambe_start") do
    tool(
      "flambe_start",
      "Start a Flambe Activity",
      "Start work in a flame. Omit parent_id to infer this agent's active parent, or pass null to start at the thread root. The reducer may rewrite the proposal and return direction or reply; act on either before continuing.",
      common_properties()
      |> Map.merge(%{
        name: %{type: "string", minLength: 1, maxLength: 255, description: "Activity name"},
        description: %{type: "string", description: "Optional activity details"},
        activity_id: positive_integer("Optional planned activity id to begin"),
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
      "End completed work. A message records a resolution; omitting it is a plain end. Open children must be closed first unless force is true. Act on any returned direction or reply.",
      %{force: %{type: "boolean", default: false, description: "Also close open descendants"}}
    )
  end

  defp tool_definition("flambe_suspend") do
    lifecycle_tool(
      "flambe_suspend",
      "Suspend a Flambe Activity",
      "Suspend work that is explicitly being tabled. Act on any returned direction or reply.",
      %{}
    )
  end

  defp tool_definition("flambe_resume") do
    lifecycle_tool(
      "flambe_resume",
      "Resume a Flambe Activity",
      "Resume suspended work. Act on any returned direction or reply.",
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
          description: "Include unstarted activities"
        }
      }),
      ["trace_id"],
      %{readOnlyHint: true, destructiveHint: false}
    )
  end

  defp tool_definition("flambe_plan") do
    tool(
      "flambe_plan",
      "Plan an unstarted Flambe activity",
      "Create an activity before it begins. Omit both times for limbo, or pass scheduled_start and scheduled_end as Unix millisecond timestamps.",
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

  defp tool(name, title, description, properties, required, annotations \\ nil) do
    definition = %{
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

    if annotations, do: Map.put(definition, :annotations, annotations), else: definition
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
      platform: %{type: "string", minLength: 1, maxLength: 100, description: "Agent host product"}
    }
  end

  defp positive_integer(description), do: %{type: "integer", minimum: 1, description: description}

  defp timestamp_schema do
    %{type: "integer", description: "Optional event time as Unix milliseconds"}
  end

  defp tool_result(result) do
    %{
      content: [%{type: "text", text: Jason.encode!(result)}],
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
end
