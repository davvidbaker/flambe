defmodule FlambeNext.Reducer.Review do
  @moduledoc """
  Model review stage of the reducer. Reduces a worker message, or a lifecycle
  proposal that a structural rule flagged, into a direction and at most one
  validated stack change.

  The database is the source of truth. This stage is stateless. Routine cases use
  a low-cost primary model; ambiguous or off-track cases are reviewed by a stronger
  escalation model before actions apply.
  """

  import Ecto.Query

  alias FlambeNext.Accounts.User
  alias FlambeNext.Reducer.{Jev, Model}
  alias FlambeNext.Repo
  alias FlambeNext.Traces
  alias FlambeNext.Traces.{Activity, Event}

  @allowed_assessments ~w(on_track slightly_off_track off_track blocked uncertain)
  @allowed_directions ~w(continue narrow_scope investigate change_approach pause stop escalate)
  @escalating_assessments ~w(slightly_off_track off_track blocked uncertain)
  @escalating_directions ~w(narrow_scope investigate change_approach pause stop escalate)
  @lifecycle_phases ~w(B R X S E J V)
  @live_phases ~w(B R X S)
  @ended_phases ~w(E J V)
  @closed_history_days 21

  def handle(%User{} = user, attrs, opts \\ []) when is_map(attrs) and is_list(opts) do
    with {:ok, trace_id} <- positive_id(attrs["trace_id"] || attrs[:trace_id]),
         {:ok, activity_id} <- positive_id(attrs["activity_id"] || attrs[:activity_id]),
         {:ok, message} <- required_string(attrs["message"] || attrs[:message]),
         agent_id <- optional_string(attrs["agent_id"] || attrs[:agent_id]),
         allow_changes? <- allow_stack_changes?(attrs),
         {:ok, context} <- build_context(user, trace_id, activity_id),
         {:ok, decision, model_info} <- decide(context, agent_id, message, allow_changes?, opts),
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

  @doc """
  Synchronous review of a start that tripped a structural rule (ADR-014).
  Returns a judgment. Callers record the start first and keep it if this fails.
  """
  def judge_structure(%User{} = _user, %Activity{} = activity, rule, opts \\ [])
      when is_map(rule) and is_list(opts) do
    case jev_structure_judgment(activity, rule, opts) do
      {:ok, judgment} ->
        {:ok, judgment}

      :fallback ->
        judge_structure_llm(activity, rule, opts)

      {:error, _reason} ->
        judge_structure_llm(activity, rule, opts)
    end
  end

  defp judge_structure_llm(activity, rule, opts) do
    if Model.available?(opts) do
      prompt = structure_prompt(activity, rule)

      with {:ok, raw} <- Model.resolve(opts).(Model.primary_model(), prompt),
           {:ok, decoded} <- Jason.decode(raw),
           {:ok, judgment} <- validate_structure(decoded, activity, rule) do
        {:ok, judgment}
      else
        {:error, %Jason.DecodeError{}} -> {:error, :invalid_model_response}
        {:error, reason} -> {:error, reason}
        :error -> {:error, :invalid_model_response}
      end
    else
      {:error, :reducer_not_configured}
    end
  end

  defp jev_structure_judgment(activity, %{name: "new_root_while_open"} = rule, opts) do
    if Jev.available?(opts) do
      criteria =
        %{"keep" => "Keep this activity as a separate root workstream."}
        |> maybe_add_reparent_choice(rule.open_leaf, "open leaf")
        |> maybe_add_reparent_choice(rule.previous_root, "previous root")

      state = %{
        activity: %{
          id: activity.id,
          name: activity.name,
          description: activity.description,
          parent_id: activity.parent_id
        },
        rule: rule
      }

      questions = %{
        "action" => %{
          type: "choice",
          instructions:
            "A worker opened a new root while it already had open work. Choose the structurally correct placement. Git commit, push, and PR bookkeeping normally belong under the work being shipped.",
          criteria: criteria
        }
      }

      with {:ok, response} <- Jev.evaluate(state, questions, opts),
           answers when is_map(answers) <- response["answers"] || response[:answers],
           %{} = answer <- answers["action"] || answers[:action],
           choice when is_binary(choice) <- answer["choice"] || answer[:choice] do
        jev_structure_choice(choice, activity, rule)
      else
        {:error, reason} -> {:error, reason}
        _ -> {:error, :invalid_jev_response}
      end
    else
      :fallback
    end
  end

  defp jev_structure_judgment(activity, %{name: "name_unfit"} = rule, opts) do
    if Jev.available?(opts) do
      state = %{
        activity: %{
          id: activity.id,
          name: activity.name,
          description: activity.description,
          parent_id: activity.parent_id
        },
        ancestors: rule.ancestors
      }

      questions = %{
        "needs_review" => %{
          type: "noul",
          instructions:
            "Does this child need generative review because its name likely indicates a structural problem or needs clarification? A poor name alone is not enough; prefer leaving plausible structure alone.",
          criteria: %{
            true: "A clarification, rename, or re-parent may be needed.",
            false: "The existing placement is plausible and should be kept."
          }
        }
      }

      with {:ok, response} <- Jev.evaluate(state, questions, opts),
           answers when is_map(answers) <- response["answers"] || response[:answers],
           %{} = answer <- answers["needs_review"] || answers[:needs_review],
           probability when is_number(probability) <- answer["noul"] || answer[:noul] do
        if probability >= 0.5 do
          :fallback
        else
          {:ok, %{assessment: "on_track", direction: nil, reply: nil, action: %{type: "keep"}}}
        end
      else
        {:error, reason} -> {:error, reason}
        _ -> {:error, :invalid_jev_response}
      end
    else
      :fallback
    end
  end

  defp jev_structure_judgment(_activity, _rule, _opts), do: :fallback

  defp maybe_add_reparent_choice(criteria, nil, _label), do: criteria

  defp maybe_add_reparent_choice(criteria, %{id: id, name: name}, label) do
    Map.put(criteria, "reparent_#{id}", "Re-parent under the #{label}: #{name}")
  end

  defp jev_structure_choice("keep", _activity, _rule) do
    {:ok, %{assessment: "on_track", direction: nil, reply: nil, action: %{type: "keep"}}}
  end

  defp jev_structure_choice("reparent_" <> id_text, activity, rule) do
    with {parent_id, ""} <- Integer.parse(id_text),
         true <- parent_id in rule.candidate_ids,
         true <- parent_id != activity.id do
      {:ok,
       %{
         assessment: "slightly_off_track",
         direction: "continue",
         reply: nil,
         action: %{type: "reparent", parent_activity_id: parent_id, activity_id: activity.id}
       }}
    else
      _ -> {:error, :invalid_jev_response}
    end
  end

  defp jev_structure_choice(_, _activity, _rule), do: {:error, :invalid_jev_response}

  defp structure_prompt(activity, rule) do
    policy =
      case rule.name do
        "new_root_while_open" ->
          """
          This worker opened a new root while it already had an open leaf. Record it as a root
          first. Staying a root is a valid answer. Re-parent only onto the open leaf or that
          leaf's root. The root activity is the intent; do not invent a stored goal.
          """

        "name_unfit" ->
          """
          This child's name shares no words with its ancestors. A poor name is more likely
          than a wrong parent. Prefer action type "ask". Rename only when the tree makes the
          meaning obvious. Re-parent only when the name clearly duplicates another listed
          activity. Otherwise keep it.
          """
      end

    """
    You are Flambe's Reducer Agent. The root activity is the intent. Judge one recorded start.
    Git commit, push, and opening a PR are wrap-up of current work, not a new goal. Do not
    treat them as a distinct workstream. If this start is that kind of bookkeeping: keep it
    nested under the work being shipped; if it was opened as a root while other work is open,
    re-parent onto the open leaf. Do not ask the worker to rename it into a fake goal.
    Exception: the assigned work is getting code onto a remote.
    #{policy}
    Return ONLY one JSON object:
    {"assessment":"on_track|slightly_off_track|off_track|blocked|uncertain","direction":null|"continue"|"narrow_scope"|"investigate"|"change_approach"|"pause"|"stop"|"escalate","reply":null|STRING,"action":{"type":"keep"}|{"type":"reparent","parent_activity_id":INTEGER}|{"type":"rename","name":STRING}|{"type":"ask","question":STRING}}
    Allowed parent ids: #{inspect(rule.candidate_ids)}
    Rule: #{Jason.encode!(rule)}
    Activity: #{Jason.encode!(%{id: activity.id, name: activity.name, parent_id: activity.parent_id, description: activity.description})}
    """
  end

  defp validate_structure(decoded, activity, rule) when is_map(decoded) do
    direction = decoded["direction"]
    reply = decoded["reply"]
    assessment = decoded["assessment"]
    candidates = MapSet.new(rule.candidate_ids)

    with true <- assessment in @allowed_assessments,
         true <- is_nil(direction) or direction in @allowed_directions,
         true <- is_nil(reply) or is_binary(reply),
         {:ok, action, reply} <- structure_action(decoded["action"], activity, candidates, reply) do
      {:ok, %{assessment: assessment, direction: direction, reply: reply, action: action}}
    else
      _ -> {:error, :invalid_model_response}
    end
  end

  defp validate_structure(_, _, _), do: {:error, :invalid_model_response}

  defp structure_action(%{"type" => "keep"}, _activity, _candidates, reply),
    do: {:ok, %{type: "keep"}, reply}

  defp structure_action(
         %{"type" => "reparent", "parent_activity_id" => parent_id},
         activity,
         candidates,
         reply
       )
       when is_integer(parent_id) and parent_id != activity.id do
    if MapSet.member?(candidates, parent_id),
      do:
        {:ok, %{type: "reparent", parent_activity_id: parent_id, activity_id: activity.id}, reply},
      else: :error
  end

  defp structure_action(%{"type" => "rename", "name" => name}, activity, _candidates, reply)
       when is_binary(name) do
    trimmed = String.trim(name)

    if trimmed != "" and trimmed != activity.name,
      do: {:ok, %{type: "rename", activity_id: activity.id, name: trimmed}, reply},
      else: :error
  end

  defp structure_action(%{"type" => "ask", "question" => question}, activity, _candidates, reply)
       when is_binary(question) do
    trimmed = String.trim(question)

    if trimmed == "" do
      :error
    else
      {:ok, %{type: "ask", activity_id: activity.id}, reply_or(reply, trimmed)}
    end
  end

  defp structure_action(_, _, _, _), do: :error

  defp reply_or(reply, _fallback) when is_binary(reply) and reply != "", do: reply
  defp reply_or(_reply, fallback), do: fallback

  defp allow_stack_changes?(attrs) do
    case Map.get(attrs, "allow_stack_changes", Map.get(attrs, :allow_stack_changes)) do
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

    by_id = Map.new(activities, &{&1.id, &1})
    ancestors = ancestors(activity, by_id)
    latest_by_id = latest_lifecycle_by_activity(trace_id)
    path_ids = MapSet.new([activity.id | Enum.map(ancestors, & &1.id)])
    cutoff = DateTime.add(DateTime.utc_now(), -@closed_history_days, :day)

    stack =
      Enum.filter(activities, &visible_in_message_context?(&1, latest_by_id, path_ids, cutoff))

    {:ok,
     %{
       trace: %{id: trace.id, name: trace.name},
       current: activity_view(activity),
       ancestors: Enum.map(ancestors, &activity_view/1),
       stack: Enum.map(stack, &activity_view/1)
     }}
  end

  defp latest_lifecycle_by_activity(trace_id) do
    from(e in Event,
      where: e.trace_id == ^trace_id and e.phase in ^@lifecycle_phases,
      distinct: e.activity_id,
      order_by: [asc: e.activity_id, desc: e.timestamp, desc: e.id]
    )
    |> Repo.all()
    |> Map.new(&{&1.activity_id, &1})
  end

  defp visible_in_message_context?(activity, latest_by_id, path_ids, cutoff) do
    MapSet.member?(path_ids, activity.id) or
      case Map.get(latest_by_id, activity.id) do
        nil ->
          true

        %{phase: phase} when phase in @live_phases ->
          true

        %{phase: phase, timestamp: timestamp} when phase in @ended_phases ->
          DateTime.compare(timestamp, cutoff) != :lt

        _ ->
          false
      end
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
      name: activity.name
    }
    |> maybe_put(:description, blank_to_nil(activity.description))
    |> maybe_put(:agent_id, activity.agent_id)
    |> maybe_put(:agent_name, activity.agent_name)
  end

  defp blank_to_nil(value) when value in [nil, ""], do: nil
  defp blank_to_nil(value), do: value

  defp decide(context, agent_id, message, allow_changes?, opts) do
    if Jev.available?(opts) do
      case jev_message_decision(context, agent_id, message, allow_changes?, opts) do
        {:ok, decision, model_info} ->
          {:ok, decision, model_info}

        :fallback ->
          decide_llm(context, agent_id, message, allow_changes?, opts)

        {:error, _reason} ->
          decide_llm(context, agent_id, message, allow_changes?, opts)
      end
    else
      decide_llm(context, agent_id, message, allow_changes?, opts)
    end
  end

  defp jev_message_decision(context, agent_id, message, allow_changes?, opts) do
    state = %{
      flame: context,
      sender_agent_id: agent_id,
      message: message,
      allow_stack_changes: allow_changes?
    }

    questions = %{
      "route" => %{
        type: "choice",
        instructions:
          "Decide whether this worker update is a routine on-track update that needs no reply and no stack mutation, or needs generative reducer review.",
        criteria: %{
          "routine" =>
            "Clearly on-track progress or bookkeeping within current work; no guidance, clarification, mutation, or escalation is useful.",
          "review" =>
            "Any ambiguity, drift, blocker, possible stack mutation, clarification, or operational guidance could be useful."
        }
      },
      "assessment" => %{
        type: "choice",
        instructions: "Assess this worker update against the current flame.",
        criteria: %{
          "on_track" => "The update advances the current activity and root intent.",
          "slightly_off_track" => "The update drifts somewhat but is easy to correct.",
          "off_track" => "The update materially diverges from the current root intent.",
          "blocked" => "The worker is blocked from making useful progress.",
          "uncertain" => "The available state is insufficient to judge confidently."
        }
      },
      "direction" => %{
        type: "choice",
        instructions:
          "Choose the smallest authoritative direction the worker needs. Choose none when no direction is needed.",
        criteria: %{
          "none" => "No steering is needed.",
          "continue" => "Continue the current approach.",
          "narrow_scope" => "Reduce scope to the essential current work.",
          "investigate" => "Investigate before making further changes.",
          "change_approach" => "Change the current implementation approach.",
          "pause" => "Pause this work temporarily.",
          "stop" => "Stop this work.",
          "escalate" => "Human judgment is required."
        }
      }
    }

    with {:ok, response} <- Jev.evaluate(state, questions, opts),
         answers when is_map(answers) <- response["answers"] || response[:answers],
         %{} = route_answer <- answers["route"] || answers[:route],
         route when is_binary(route) <- route_answer["choice"] || route_answer[:choice],
         %{} = assessment_answer <- answers["assessment"] || answers[:assessment],
         assessment when assessment in @allowed_assessments <-
           assessment_answer["choice"] || assessment_answer[:choice],
         %{} = direction_answer <- answers["direction"] || answers[:direction],
         direction_choice when is_binary(direction_choice) <-
           direction_answer["choice"] || direction_answer[:choice],
         true <- direction_choice == "none" or direction_choice in @allowed_directions do
      direction = if direction_choice == "none", do: nil, else: direction_choice
      model = response["model"] || response[:model] || Jev.model()

      model_info = %{
        primary_model: model,
        final_model: model,
        escalated: false,
        escalation_reason: nil
      }

      case route do
        "routine" ->
          {:ok,
           %{
             "assessment" => assessment,
             "direction" => direction,
             "reply" => nil,
             "rationale" => "Jev classified this as routine reducer work.",
             "actions" => [%{"type" => "no_op"}]
           }, model_info}

        "review" ->
          if Model.available?(opts) do
            :fallback
          else
            {:ok,
             %{
               "assessment" => assessment,
               "direction" => direction,
               "reply" => nil,
               "rationale" =>
                 "Jev returned a typed decision; no generative reducer was configured for a richer review.",
               "actions" => [%{"type" => "no_op"}]
             }, model_info}
          end

        _ ->
          {:error, :invalid_jev_response}
      end
    else
      {:error, reason} -> {:error, reason}
      _ -> {:error, :invalid_jev_response}
    end
  end

  defp decide_llm(context, agent_id, message, allow_changes?, opts) do
    if not Model.available?(opts) do
      {:error, :reducer_not_configured}
    else
      prompt = reducer_prompt(context, agent_id, message, allow_changes?)
      llm = Model.resolve(opts)
      primary_model = Model.primary_model()

    case model_decision(llm, primary_model, prompt, context) do
      {:ok, primary_decision} ->
        maybe_escalate(llm, primary_decision, prompt, context, primary_model)

      {:error, primary_error} ->
        # Invalid or unavailable cheap-model output should fail safe by asking the
        # stronger model rather than dropping a worker message or applying guesses.
        escalation_model = Model.escalation_model()

        with {:ok, final_decision} <-
               model_decision(
                 llm,
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
  end

  defp maybe_escalate(llm, primary_decision, prompt, context, primary_model) do
    if escalation_needed?(primary_decision) do
      escalation_model = Model.escalation_model()

      with {:ok, final_decision} <-
             model_decision(
               llm,
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

    A flame is the CURRENT STACK represented below: every non-ended activity, the path to
    the activity being judged, and ended work whose last lifecycle event is within
    #{@closed_history_days} days. Older closed subtrees are omitted. Worker agents see
    local branches; you must judge each incoming message against this stack and steer the
    worker back toward global intent when it drifts.

    Rules:
    - Treat the persisted stack as source of truth. Do not invent work that is not justified.
    - Prefer restraint and the smallest useful change when uncertain.
    - You may create a necessary child activity or clarify an existing activity.
    - You may NOT change global intent. If it appears wrong, use direction=escalate and recommend a change.
    - A direction is authoritative when present. Workers are expected to obey it.
    - For routine on-track updates that need no guidance, direction and reply may be null.
    - Never create bookkeeping nodes for trivial progress messages, git commits, or pushes.
      Committing and pushing are usually wrap-up of the current activity, not new work.
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

  defp model_decision(llm, model, prompt, context) do
    with {:ok, raw} <- llm.(model, prompt),
         {:ok, decoded} <- Jason.decode(raw),
         :ok <- validate_decision(decoded, context) do
      {:ok, decoded}
    else
      {:error, %Jason.DecodeError{}} -> {:error, :invalid_model_response}
      {:error, reason} -> {:error, reason}
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
