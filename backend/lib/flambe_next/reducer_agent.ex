defmodule FlambeNext.ReducerAgent do
  @moduledoc """
  Reduces worker-agent messages into small, validated changes to the current flame
  and a direction back to the worker.

  The database is the source of truth. The reducer itself is stateless.
  Routine reductions use a low-cost primary model; ambiguous or off-track cases
  are automatically reviewed by a stronger escalation model before actions apply.
  """

  import Ecto.Query

  alias FlambeNext.Accounts.User
  alias FlambeNext.Repo
  alias FlambeNext.Traces
  alias FlambeNext.Traces.Activity

  @allowed_assessments ~w(on_track slightly_off_track off_track blocked uncertain)
  @allowed_directions ~w(continue narrow_scope investigate change_approach pause stop escalate)
  @escalating_assessments ~w(slightly_off_track off_track blocked uncertain)
  @escalating_directions ~w(narrow_scope investigate change_approach pause stop escalate)

  def handle(%User{} = user, attrs) when is_map(attrs) do
    with {:ok, trace_id} <- positive_id(attrs["trace_id"] || attrs[:trace_id]),
         {:ok, activity_id} <- positive_id(attrs["activity_id"] || attrs[:activity_id]),
         {:ok, message} <- required_string(attrs["message"] || attrs[:message]),
         agent_id <- optional_string(attrs["agent_id"] || attrs[:agent_id]),
         allow_changes? <- allow_stack_changes?(attrs),
         {:ok, context} <- build_context(user, trace_id, activity_id),
         {:ok, decision, model_info} <- decide(context, agent_id, message, allow_changes?),
         actions <- restrict_actions(decision["actions"] || [], allow_changes?),
         {:ok, applied} <- apply_actions(user, context, actions) do
      record_exchange(context, agent_id, message, decision, model_info)

      {:ok,
       %{
         assessment: decision["assessment"],
         direction: decision["direction"],
         reply: decision["reply"],
         rationale: decision["rationale"],
         actions_applied: applied,
         reducer_model: model_info.final_model,
         escalated: model_info.escalated
       }}
    end
  rescue
    Ecto.NoResultsError -> {:error, :not_found}
  end

  @doc """
  Callers that pass `allow_stack_changes: false` want advice only. Their decisions keep
  `assessment`/`direction`/`reply`, but any stack mutation the model proposed is dropped.
  The default (ADR-011) is that the reducer is the single writer and applies them.
  """
  def restrict_actions(actions, true), do: actions

  def restrict_actions(actions, false) do
    Enum.filter(actions, &match?(%{"type" => "no_op"}, &1))
  end

  defp allow_stack_changes?(attrs) do
    case attrs["allow_stack_changes"] || attrs[:allow_stack_changes] do
      false -> false
      "false" -> false
      _ -> true
    end
  end

  defp build_context(user, trace_id, activity_id) do
    trace = Traces.get_user_trace!(user, trace_id)
    activity = Traces.get_user_trace_activity!(user, trace_id, activity_id)

    activities =
      from(a in Activity,
        join: thread in assoc(a, :thread),
        join: trace in assoc(thread, :trace),
        where: trace.id == ^trace_id and trace.user_id == ^user.id,
        order_by: [asc: thread.rank, asc: a.id]
      )
      |> Repo.all()

    by_parent = Enum.group_by(activities, & &1.parent_id)
    ancestors = ancestors(activity, Map.new(activities, &{&1.id, &1}))
    children = Map.get(by_parent, activity.id, [])

    siblings =
      Map.get(by_parent, activity.parent_id, [])
      |> Enum.reject(&(&1.id == activity.id))

    {:ok,
     %{
       trace: %{id: trace.id, name: trace.name},
       current: activity_view(activity),
       ancestors: Enum.map(ancestors, &activity_view/1),
       children: Enum.map(children, &activity_view/1),
       siblings: Enum.map(siblings, &activity_view/1),
       stack: Enum.map(activities, &activity_view/1)
     }}
  end

  defp ancestors(%Activity{parent_id: nil}, _by_id), do: []

  defp ancestors(%Activity{parent_id: parent_id}, by_id) do
    case by_id[parent_id] do
      nil -> []
      parent -> ancestors(parent, by_id) ++ [parent]
    end
  end

  defp activity_view(activity) do
    %{
      id: activity.id,
      parent_id: activity.parent_id,
      thread_id: activity.thread_id,
      name: activity.name,
      description: activity.description,
      agent_id: activity.agent_id,
      agent_name: activity.agent_name
    }
  end

  defp decide(context, agent_id, message, allow_changes?) do
    prompt = reducer_prompt(context, agent_id, message, allow_changes?)
    primary_model = primary_model()

    case model_decision(primary_model, prompt, context) do
      {:ok, primary_decision} ->
        maybe_escalate(primary_decision, prompt, context, primary_model)

      {:error, primary_error} ->
        # Invalid or unavailable cheap-model output should fail safe by asking the
        # stronger model rather than dropping a worker message or applying guesses.
        escalation_model = escalation_model()

        with {:ok, final_decision} <-
               model_decision(
                 escalation_model,
                 escalation_prompt(prompt, nil, primary_error),
                 context
               ) do
          {:ok, final_decision,
           %{
             primary_model: primary_model,
             final_model: escalation_model,
             escalated: true,
             escalation_reason: "primary_model_error"
           }}
        end
    end
  end

  defp maybe_escalate(primary_decision, prompt, context, primary_model) do
    if escalation_needed?(primary_decision) do
      escalation_model = escalation_model()

      with {:ok, final_decision} <-
             model_decision(
               escalation_model,
               escalation_prompt(prompt, primary_decision, nil),
               context
             ) do
        {:ok, final_decision,
         %{
           primary_model: primary_model,
           final_model: escalation_model,
           escalated: true,
           escalation_reason: escalation_reason(primary_decision)
         }}
      end
    else
      {:ok, primary_decision,
       %{
         primary_model: primary_model,
         final_model: primary_model,
         escalated: false,
         escalation_reason: nil
       }}
    end
  end

  defp escalation_needed?(decision) do
    decision["assessment"] in @escalating_assessments or
      decision["direction"] in @escalating_directions
  end

  defp escalation_reason(decision) do
    cond do
      decision["assessment"] in @escalating_assessments ->
        "assessment=#{decision["assessment"]}"

      decision["direction"] in @escalating_directions ->
        "direction=#{decision["direction"]}"

      true ->
        "policy"
    end
  end

  defp reducer_prompt(context, agent_id, message, allow_changes?) do
    stack_policy =
      if allow_changes? do
        ""
      else
        """

        This worker maintains its own stack. Do NOT propose create_child or update_activity;
        return actions as [] or [{\"type\":\"no_op\"}]. Steer only through assessment, direction, and reply.
        """
      end

    """
    You are Flambe's Reducer Agent. You preserve the global intent of the current flame.
    #{stack_policy}

    A flame is the CURRENT STACK represented below. Worker agents see local branches; you
    must judge each incoming message against the whole stack and steer the worker back
    toward global intent when it drifts.

    Rules:
    - Treat the persisted stack as source of truth. Do not invent work that is not justified.
    - Prefer restraint and the smallest useful change when uncertain.
    - You may create a necessary child activity or clarify an existing activity.
    - You may NOT change global intent. If it appears wrong, use direction=escalate and recommend a change.
    - A direction is authoritative when present. Workers are expected to obey it.
    - For routine on-track updates that need no guidance, direction and reply may be null.
    - Never create bookkeeping nodes for trivial progress messages.
    - Return at most ONE action. Prefer no_op when a stack mutation is unnecessary.
    - Keep replies concise and operational.

    Allowed action types:
    1. {\"type\":\"create_child\",\"parent_activity_id\":INTEGER,\"name\":STRING,\"description\":STRING_OR_NULL}
    2. {\"type\":\"update_activity\",\"activity_id\":INTEGER,\"name\":STRING_OR_NULL,\"description\":STRING_OR_NULL}
    3. {\"type\":\"no_op\"}

    Allowed assessment values: #{Enum.join(@allowed_assessments, ", ")}
    Allowed direction values: #{Enum.join(@allowed_directions, ", ")} or null

    Return ONLY one JSON object with exactly these top-level keys:
    {
      \"assessment\": STRING,
      \"direction\": STRING_OR_NULL,
      \"reply\": STRING_OR_NULL,
      \"rationale\": STRING,
      \"actions\": ARRAY
    }

    Current flame context:
    #{Jason.encode!(context)}

    Sender agent_id: #{inspect(agent_id)}
    Incoming message:
    #{message}
    """
  end

  defp escalation_prompt(original_prompt, primary_decision, primary_error) do
    first_pass =
      cond do
        is_map(primary_decision) -> Jason.encode!(primary_decision)
        not is_nil(primary_error) -> "primary model failed: #{inspect(primary_error)}"
        true -> "unavailable"
      end

    """
    #{original_prompt}

    ESCALATION REVIEW:
    A lower-cost model made the first pass below. This case was escalated because it may
    affect global intent or because the first pass failed validation. Independently review
    the worker message and flame state. Do not defer to the first pass. Return the corrected
    final JSON decision using the exact same schema.

    First pass:
    #{first_pass}
    """
  end

  defp model_decision(model, prompt, context) do
    with {:ok, raw} <- llm(model, prompt),
         {:ok, decoded} <- Jason.decode(raw),
         :ok <- validate_decision(decoded, context) do
      {:ok, decoded}
    else
      {:error, %Jason.DecodeError{}} -> {:error, :invalid_model_response}
      {:error, reason} -> {:error, reason}
    end
  end

  defp llm(model, prompt) do
    case System.get_env("OPENAI_API_KEY") do
      nil -> {:error, :reducer_not_configured}
      "" -> {:error, :reducer_not_configured}
      api_key -> call_openai(api_key, model, prompt)
    end
  end

  defp primary_model do
    System.get_env("FLAMBE_REDUCER_PRIMARY_MODEL") ||
      System.get_env("FLAMBE_REDUCER_MODEL") ||
      "gpt-5.6-luna"
  end

  defp escalation_model do
    System.get_env("FLAMBE_REDUCER_ESCALATION_MODEL") || "gpt-5.6-terra"
  end

  defp call_openai(api_key, model, prompt) do
    body =
      Jason.encode!(%{
        model: model,
        input: prompt,
        reasoning: %{effort: "low"},
        text: %{format: %{type: "json_object"}}
      })

    request =
      {~c"https://api.openai.com/v1/responses",
       [
         {~c"authorization", ~c"Bearer #{api_key}"},
         {~c"content-type", ~c"application/json"}
       ], ~c"application/json", body}

    case :httpc.request(:post, request, [timeout: 60_000], body_format: :binary) do
      {:ok, {{_http, status, _reason}, _headers, response_body}} when status in 200..299 ->
        extract_output_text(response_body)

      {:ok, {{_http, status, _reason}, _headers, response_body}} ->
        {:error, {:model_http_error, status, response_body}}

      {:error, reason} ->
        {:error, {:model_transport_error, reason}}
    end
  end

  defp extract_output_text(response_body) do
    with {:ok, response} <- Jason.decode(response_body),
         output when is_list(output) <- response["output"],
         text when is_binary(text) <-
           Enum.find_value(output, fn item ->
             item["content"]
             |> List.wrap()
             |> Enum.find_value(fn content ->
               if content["type"] == "output_text", do: content["text"]
             end)
           end) do
      {:ok, text}
    else
      _ -> {:error, :missing_model_output}
    end
  end

  defp validate_decision(decision, context) when is_map(decision) do
    assessment = decision["assessment"]
    direction = decision["direction"]
    reply = decision["reply"]
    rationale = decision["rationale"]
    actions = decision["actions"]

    cond do
      assessment not in @allowed_assessments ->
        {:error, :invalid_model_response}

      not is_nil(direction) and direction not in @allowed_directions ->
        {:error, :invalid_model_response}

      not is_nil(reply) and not is_binary(reply) ->
        {:error, :invalid_model_response}

      not is_binary(rationale) ->
        {:error, :invalid_model_response}

      not is_list(actions) or length(actions) > 1 ->
        {:error, :invalid_model_response}

      not valid_actions?(actions, context) ->
        {:error, :invalid_model_response}

      true ->
        :ok
    end
  end

  defp validate_decision(_, _), do: {:error, :invalid_model_response}

  defp valid_actions?(actions, context) do
    ids = MapSet.new(Enum.map(context.stack, & &1.id))

    Enum.all?(actions, fn
      %{"type" => "no_op"} ->
        true

      %{"type" => "create_child", "parent_activity_id" => parent_id, "name" => name}
      when is_integer(parent_id) and is_binary(name) ->
        MapSet.member?(ids, parent_id) and String.trim(name) != ""

      %{"type" => "update_activity", "activity_id" => activity_id} = action
      when is_integer(activity_id) ->
        name = action["name"]
        description = action["description"]

        MapSet.member?(ids, activity_id) and
          (is_nil(name) or is_binary(name)) and
          (is_nil(description) or is_binary(description)) and
          (not is_nil(name) or not is_nil(description))

      _ ->
        false
    end)
  end

  defp apply_actions(user, context, actions) do
    Enum.reduce_while(actions, {:ok, []}, fn action, {:ok, applied} ->
      case apply_action(user, context, action) do
        {:ok, result} -> {:cont, {:ok, [result | applied]}}
        {:error, reason} -> {:halt, {:error, reason}}
      end
    end)
    |> case do
      {:ok, applied} -> {:ok, Enum.reverse(applied)}
      other -> other
    end
  end

  defp apply_action(_user, _context, %{"type" => "no_op"}), do: {:ok, %{type: "no_op"}}

  defp apply_action(
         user,
         context,
         %{
           "type" => "create_child",
           "parent_activity_id" => parent_id,
           "name" => name
         } = action
       ) do
    parent = Traces.get_user_trace_activity!(user, context.trace.id, parent_id)
    thread = Traces.get_user_trace_thread!(user, context.trace.id, parent.thread_id)
    trace = Traces.get_user_trace!(user, context.trace.id)

    activity_attrs = %{
      "name" => String.trim(name),
      "description" => action["description"]
    }

    event_attrs = %{
      "phase" => "reducer_created",
      "message" => "Created by Reducer Agent from worker message",
      "timestamp_integer" => System.system_time(:millisecond)
    }

    case Traces.create_activity(trace, thread, parent, activity_attrs, event_attrs) do
      {:ok, activity, _event} ->
        {:ok, %{type: "create_child", activity_id: activity.id, parent_activity_id: parent.id}}

      {:error, changeset} ->
        {:error, {:invalid_action, changeset}}
    end
  end

  defp apply_action(user, _context, %{"type" => "update_activity", "activity_id" => id} = action) do
    activity = Traces.get_user_activity!(user, id)

    attrs =
      %{}
      |> maybe_put("name", action["name"])
      |> maybe_put("description", action["description"])

    case Traces.update_activity(activity, attrs, activity.categories) do
      {:ok, updated} -> {:ok, %{type: "update_activity", activity_id: updated.id}}
      {:error, changeset} -> {:error, {:invalid_action, changeset}}
    end
  end

  defp record_exchange(context, agent_id, message, decision, model_info) do
    trace = Repo.get!(FlambeNext.Traces.Trace, context.trace.id)
    activity = Repo.get!(Activity, context.current.id)
    now = System.system_time(:millisecond)

    _ =
      Traces.create_event(trace, activity, %{
        "phase" => "reducer_incoming",
        "message" => "#{agent_id || "worker"}: #{message}",
        "timestamp_integer" => now
      })

    model_summary =
      if model_info.escalated do
        "model=#{model_info.primary_model}->#{model_info.final_model} escalation=#{model_info.escalation_reason}"
      else
        "model=#{model_info.final_model}"
      end

    summary =
      [
        model_summary,
        "assessment=#{decision["assessment"]}",
        decision["direction"] && "direction=#{decision["direction"]}",
        decision["reply"] && "reply=#{decision["reply"]}",
        "rationale=#{decision["rationale"]}"
      ]
      |> Enum.reject(&is_nil/1)
      |> Enum.join(" | ")

    _ =
      Traces.create_event(trace, activity, %{
        "phase" => "reducer_decision",
        "message" => summary,
        "timestamp_integer" => now + 1
      })

    :ok
  end

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)

  defp positive_id(value) when is_integer(value) and value > 0, do: {:ok, value}

  defp positive_id(value) when is_binary(value) do
    case Integer.parse(value) do
      {id, ""} when id > 0 -> {:ok, id}
      _ -> {:error, :invalid_input}
    end
  end

  defp positive_id(_), do: {:error, :invalid_input}

  defp required_string(value) when is_binary(value) do
    case String.trim(value) do
      "" -> {:error, :invalid_input}
      trimmed -> {:ok, trimmed}
    end
  end

  defp required_string(_), do: {:error, :invalid_input}

  defp optional_string(nil), do: nil
  defp optional_string(value) when is_binary(value), do: String.trim(value)
  defp optional_string(value), do: to_string(value)
end
