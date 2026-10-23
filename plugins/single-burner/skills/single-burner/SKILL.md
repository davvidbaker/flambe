---
name: single-burner
description: Track substantial work in the selected local Single Burner instance and complete requested reducer reviews with the current work AI, without another model or API key.
---

# Single Burner

Use Flambe to record **semantic work units** as a live flame chart. Do not log every command, file open, tool call, or hidden reasoning step. Skip trivial one-offs.

The MCP server is the execution layer. This skill is the workflow layer.

## Establish context

This plugin accesses **Single Burner**, the selected local Flambe instance.
It cannot access **Cloud** or **Development**. A trace id selects data inside
this instance; it does not switch instances. Verify this connection before use.
The database stays local; context returned to a cloud-hosted work AI reaches
that provider. Agent mode makes no additional inference request from Flambe.

On the first Flambe interaction in a conversation, and after an explicit switch:

- Resolve the user's intended instance: **Cloud**, **Single Burner**, or **Development**. Use a separately connected local instance only when its tools are available and the user has selected it. If intent is ambiguous and more than one connection is available, ask which instance before reading activity data or writing.
- Call `flambe_traces` on the intended connection, even if a trace id was mentioned earlier. Verify the returned `instance` matches the requested destination. If that connection is unavailable, explain that it is not connected; never substitute Cloud or another instance.
- Briefly name the instance when establishing or switching context, for example: "Using Single Burner for this chat."
- Keep the connection, `instance.id`, and `trace_id` together for this conversation. Reuse a trace id only when it belongs to that verified instance. If the user names a trace, match it inside that instance; otherwise use `default_trace_id`.
- Pass the exact returned `instance.id` as `expected_instance_id` on every other Flambe tool call, including status reads. Never infer it from a label or copy it between connections.
- Check `instance` in every result, including errors. On `INSTANCE_REQUIRED` or `INSTANCE_MISMATCH`, stop the attempted operation and rediscover the intended connection. Do not replace the expected id with a different instance's id just to make the request succeed.
- Stay with the selected instance until the user explicitly switches. On a switch, discard the previous instance's trace/activity ids and rediscover on the new connection.
- Create one stable conversation-local `agent_id` such as `chatgpt:<8 random lowercase hex characters>` and reuse it for every Flambe tool call in this conversation.
- Pass the actual host as `platform`, such as `ChatGPT`, `Codex`, or `Claude`.
- Do not invent an `agent_name`; let the Reducer Agent name the agent.

Do not list threads or categories merely to decide placement. The reducer owns placement.

## Think in a stack

Treat attention as a **call stack**, not a flat to-do list.

When work on a parent goal exposes a specific bug, prerequisite, design question, test failure, or verification step, that is a **push**: call `flambe_start` for a nested activity and leave the parent running.

When the nested work is complete, **pop** it with `flambe_end` and continue the parent.

- Leave parents running while going deeper.
- Put nested work under the workstream it serves, not beside the root.
- When moving to a true sibling, end the current leaf first, then start the sibling.
- Use `parent_id: null` only for a genuinely new top-level workstream.
- Omit `parent_id` to let the reducer infer this agent's active parent.
- Keep the active stack truthful as attention changes. Do not pre-plan a detailed flame or reconstruct one after the fact.

## Tool mapping

Use the MCP tools directly:

- `flambe_start`: begin meaningful work. Keep names concrete and under 255 characters.
- `flambe_end`: finish work. Prefer an outcome message over a generic "done".
- `flambe_suspend`: explicitly table work that is being paused.
- `flambe_resume`: resume suspended work.
- `flambe_status`: inspect active, suspended, or unstarted work.
- `flambe_plan`: create future or limbo work without beginning it.
- `flambe_message`: ask the Reducer Agent about scope, drift, or a requested change in approach.
- `flambe_traces`: establish the connected instance and discover its traces before first use or an explicit switch.

## Every lifecycle call is a proposal

The reducer may rewrite what you proposed. Always read the complete result from `flambe_start`, `flambe_end`, `flambe_suspend`, `flambe_resume`, and `flambe_message`.

The result may contain:

- `direction`
- `reply`
- `actions_applied`
- corrected parent/thread placement
- duplicate reuse or ancestor resumption
- descendant closure when a parent ends with force

The returned state is authoritative. Do not undo a reducer rewrite and do not re-issue a proposal merely because the reducer changed it.

If `direction` is `pause`, `stop`, or `escalate`, stop further work and surface the reducer's reply to the user before continuing.

If the reducer asks a question in `reply`, answer it before making another substantive stack change, normally with `flambe_message`.

## Ask the reducer before drifting

Call `flambe_message` when you are about to:

- widen scope beyond the activity you started
- switch approach because the current plan stalled
- end a root workstream
- continue while suspecting the work has drifted from the user's request
- answer a question the reducer asked

Do not use `flambe_message` for routine progress, and do not use it instead of lifecycle tools.

If the server reports `REDUCER_NOT_CONFIGURED`, do not retry or send the message to another instance. Single Burner's AI review is optional and off by default; deterministic tracking remains available. Surface unresolved judgment in this chat. If a lifecycle result reports `model_review.status: failed`, the activity was recorded: use its returned id and state, report the review failure, and do not repeat the start or substitute another instance.

## Review with the current work AI

On a Single Burner connection configured for `agent` review, `flambe_message`
returns `review` with `model_review.status: awaiting_decision`. Flagged starts
normally return a small review-available notice; request full review only when
placement or scope needs judgment. Automatic reviews of flagged starts are
optional. Do not review every start/end. Review context contains the current
path and this agent's open work; compact lifecycle replies mark their state scope.
Omitted activities are not ended.
You are the reviewer. Read the supplied instructions, context, and decision
schema, reason about the user's intent and current stack, then call
`flambe_decide` on that same connection with the exact `review_id`, instance,
trace, stable `agent_id`, and your decision. Complete that review before further
substantive work. Do not start another model or request a model API key.

The local engine validates and applies the decision. Follow its returned
state and direction. Submit at most one permitted action; use no actions and
escalate to the user when judgment is unresolved. This is your own review of the
work, not independent approval. Do not repeat an already-recorded start.
On `REDUCER_STATE_CHANGED` or `REVIEW_EXPIRED`, request a fresh `flambe_message`
review for that activity and reassess it. Identical submission retries return
the original receipt with `replayed: true`, without applying another action.
Never send a local review to Cloud or another connection. If `flambe_decide`
is unavailable, report the missing support rather than pretending to submit it.

## Status lookup

Reuse activity ids returned earlier in the conversation.

Call `flambe_status` only when you need to recover a matching open activity, inspect suspended work, or check unstarted work. Prefer:

- `active_only: true` when recovering the current stack.
- `include_unstarted: true` at the end of substantial work.

Ignore unrelated work owned by other agents.

## Ending substantial work

Before stopping after substantial work:

1. End the current leaf with its concrete outcome.
2. Pop completed ancestors when their goals are actually complete.
3. Call `flambe_status` with `include_unstarted: true`.
4. If a plausible next activity exists, report it to the reducer with `flambe_message`. Begin it only when the returned direction says to continue.

Do not begin unrelated planned work merely because it exists.

## What belongs in the flame

Start a new activity when the goal or scope meaningfully changes, such as:

- a focused implementation
- a discovered prerequisite
- a concrete bug
- a design decision that needs investigation
- focused tests
- verification of the result

Do not create activities for commits, pushes, file reads, shell commands, individual tool calls, or narration of hidden reasoning.

Name the action and object, for example `Fix USERPROFILE config resolution`, not `Investigate`, `Implement`, or `Work on tests`.

Keep secrets, credentials, full transcripts, and sensitive payloads out of activity names, descriptions, and messages.
