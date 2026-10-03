---
name: flambe
description: Track substantial or multi-step work in Flambe as a truthful live call stack. Use the Flambe MCP tools to start, nest, suspend, resume, end, plan, and review work while following Reducer Agent direction.
---

# Flambe

Use Flambe to record **semantic work units** as a live flame chart. Do not log every command, file open, tool call, or hidden reasoning step. Skip trivial one-offs.

The MCP server is the execution layer. This skill is the workflow layer.

## Establish context

On the first Flambe tool call in a conversation:

- Reuse any `trace_id` already established in the conversation.
- Otherwise call `flambe_traces`. If the user's request names a trace, match it by name. Otherwise use `default_trace_id`.
- Create one stable conversation-local `agent_id` such as `chatgpt:<8 random lowercase hex characters>` and reuse it for every Flambe tool call in this conversation.
- Pass `platform: "ChatGPT"`.
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
- `flambe_traces`: discover trace ids only when the target trace is not already known.

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

If the server reports `REDUCER_NOT_CONFIGURED`, do not retry. Continue deterministic lifecycle tracking and surface any unresolved judgment to the user.

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
