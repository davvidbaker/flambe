defmodule FlambeNextWeb.MCPHandler do
  @moduledoc false

  use ExMCP.Server.Handler

  alias FlambeNext.{AgentCommandIdentity, AgentCommands, Agents, Instance, Traces}
  alias FlambeNext.Traces.Reconciliation

  @tools ~w(flambe_traces flambe_start flambe_end flambe_suspend flambe_resume flambe_resurrect flambe_status flambe_message flambe_plan flambe_reconcile_version flambe_reconcile)

  @impl GenServer
  def init(%{user: user} = context), do: {:ok, Map.put(context, :user, user)}

  @impl ExMCP.Server.Handler
  def handle_initialize(params, state) do
    {:ok,
     %{
       protocolVersion: params["protocolVersion"],
       serverInfo: %{name: "flambe", title: "Flambe — #{Instance.info().name}", version: "0.1.0"},
       instructions:
         "This connection accesses #{Instance.info().name} only. Discover its identity with flambe_traces before acting; never substitute another instance.",
       capabilities: %{tools: %{listChanged: false}}
     }, state}
  end

  @impl ExMCP.Server.Handler
  def handle_list_tools(_cursor, state) do
    tools =
      Enum.map(tool_definitions(), fn tool ->
        Map.update!(
          tool,
          :description,
          &(&1 <>
              " Connected instance: #{Instance.info().name}. This connection cannot access another instance.")
        )
      end)

    {:ok, tools, nil, state}
  end

  # Exported as cli/src/mcp-tools.json for the packaged Single Burner adapter.
  # The cross-runtime contract test checks that its schemas remain in sync.
  def tool_definitions, do: Enum.map(@tools, &tool_definition/1)

  @impl ExMCP.Server.Handler
  def handle_call_tool("flambe_traces", _arguments, state) do
    traces =
      state.user
      |> Traces.list_user_traces()
      |> Enum.map(fn trace -> %{id: trace.id, name: trace.name} end)

    {:ok,
     tool_result(%{
       traces: traces,
       default_trace_id: traces |> List.first() |> then(&(&1 && &1.id))
     }), state}
  end

  def handle_call_tool(name, arguments, state)
      when name in ~w(flambe_reconcile_version flambe_reconcile) and is_map(arguments) do
    result =
      with :ok <- Instance.verify(arguments),
           id when is_integer(id) and id > 0 <- arguments["trace_id"] do
        if name == "flambe_reconcile_version" do
          Reconciliation.version(state.user, id)
        else
          with {:ok, agent} <- reconciliation_agent(state, arguments) do
            Reconciliation.apply(state.user, id, agent, arguments["proposal"])
          end
        end
      else
        {:error, reason} -> {:error, reason}
        _ -> {:error, :invalid_reconciliation}
      end

    response =
      case result do
        {:ok, data} -> tool_result(data)
        {:error, reason} -> tool_error(reason)
      end

    {:ok, response, state}
  end

  def handle_call_tool("flambe_" <> command, arguments, state)
      when command in ~w(start end suspend resume resurrect status message plan) and
             is_map(arguments) do
    arguments =
      AgentCommandIdentity.merge(arguments, state.agent, Map.get(state, :platform?, false))

    result =
      case execute(state.user, command, arguments) do
        {:ok, command_result} -> tool_result(command_result)
        {:error, reason} -> tool_error(reason)
      end

    {:ok, result, state}
  end

  def handle_call_tool(name, _arguments, state) do
    {:error, ExMCP.Error.protocol_error(-32602, "Unknown tool: #{name}"), state}
  end

  defp reconciliation_agent(%{agent: agent}, _arguments) when not is_nil(agent), do: {:ok, agent}

  defp reconciliation_agent(state, %{"agent_id" => id} = arguments)
       when is_binary(id) and byte_size(id) in 1..200 do
    case Agents.identify(state.user, id, arguments["agent_name"], arguments["platform"]) do
      {:ok, %{agent: agent}} -> {:ok, %{id: agent.agent_id, name: agent.name}}
      _ -> {:error, :agent_id_required}
    end
  end

  defp reconciliation_agent(_state, _arguments), do: {:error, :agent_id_required}

  defp execute(user, command, arguments) do
    with :ok <- Instance.verify(arguments) do
      AgentCommands.execute(user, command, Map.delete(arguments, "expected_instance_id"))
    end
  end

  defp tool_definition("flambe_traces") do
    tool(
      "flambe_traces",
      "List Flambe traces",
      "Discover this connection's instance and available traces before the first Flambe action in each chat, even if a trace id is already known. Trace ids cannot select another instance.",
      %{},
      [],
      %{readOnlyHint: true, destructiveHint: false, openWorldHint: false}
    )
  end

  defp tool_definition("flambe_reconcile_version") do
    tool(
      "flambe_reconcile_version",
      "Read Flambé trace version",
      "Read the baseline version for an explicit historical trace reconciliation.",
      Map.take(common_properties(), [:trace_id]),
      ["trace_id"],
      %{readOnlyHint: true, destructiveHint: false, openWorldHint: false}
    )
  end

  defp tool_definition("flambe_reconcile") do
    tool(
      "flambe_reconcile",
      "Reconcile Flambé history",
      "Review and atomically apply one evidence-backed historical repair. Keep full transcripts local.",
      Map.put(common_properties(), :proposal, %{
        type: "object",
        description:
          "Reconciliation proposal with repair_id, trace_version, changes and coverage_gaps."
      }),
      ["trace_id", "agent_id", "proposal"],
      %{readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true}
    )
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
      ["trace_id", "name"],
      mutation_annotations(true)
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

  defp tool_definition("flambe_resurrect") do
    lifecycle_tool(
      "flambe_resurrect",
      "Resurrect a Flambe Activity",
      "Reopen ended work by activity id, preserving its history. Act on any returned direction or reply.",
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
      %{readOnlyHint: true, destructiveHint: false, openWorldHint: false}
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
      ["trace_id", "name"],
      mutation_annotations(true)
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
      ["trace_id", "message"],
      mutation_annotations(true)
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

    tool(
      name,
      title,
      description,
      properties,
      ["trace_id", "activity_id"],
      mutation_annotations(false)
    )
  end

  defp mutation_annotations(open_world) do
    %{readOnlyHint: false, destructiveHint: false, openWorldHint: open_world}
  end

  defp tool(name, title, description, properties, required, annotations) do
    scopes = ["flambe"]

    {properties, required} =
      if name == "flambe_traces" do
        {properties, required}
      else
        {Map.put(properties, :expected_instance_id, %{
           type: "string",
           minLength: 1,
           description:
             "Exact instance.id returned by flambe_traces on this connection. Never copy it from another connection."
         }), ["expected_instance_id" | required]}
      end

    definition = %{
      name: name,
      title: title,
      description: description,
      securitySchemes: [%{type: "oauth2", scopes: scopes}],
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
    result = Map.put(result, :instance, Instance.info())

    %{
      content: [%{type: "text", text: Jason.encode!(result)}],
      structuredContent: result,
      isError: false
    }
  end

  defp tool_error(reason) do
    {code, message, details} = command_error(reason)
    structured = %{code: code, message: message, instance: Instance.info()} |> Map.merge(details)

    %{
      content: [%{type: "text", text: Jason.encode!(structured)}],
      structuredContent: structured,
      isError: true
    }
  end

  defp command_error({:instance_required, message}), do: {"INSTANCE_REQUIRED", message, %{}}
  defp command_error({:instance_mismatch, message}), do: {"INSTANCE_MISMATCH", message, %{}}

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

  defp command_error(reason)
       when reason in [
              :invalid_reconciliation,
              :trace_version_changed,
              :repair_id_reused,
              :agent_id_required
            ] do
    code = reason |> Atom.to_string() |> String.upcase()
    {code, "The reconciliation request could not be applied", %{}}
  end

  defp command_error(_reason), do: {"COMMAND_FAILED", "The agent command failed", %{}}
end
