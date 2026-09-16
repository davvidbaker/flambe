# Shared agent commands implementation

User authorized implementation after reviewing MCP as the primary hosted agent interface,
with REST retained for the browser and CLI retained for shell/local/offline use.

## Shared contract

- `FlambeNext.AgentCommands.execute(user, command, attrs)` returns `{:ok, map}` or
  `{:error, reason}`. Command is a string: `start`, `end`, `suspend`, `resume`,
  `status`, or `message`. Attributes have string keys.
- Inputs: `trace_id` required; `agent_id`, `agent_name` optional. Start accepts
  `name`, `description`, `thread_id`, `parent_id`, `category_ids`, `timestamp`.
  Omitted parent means infer within the selected thread and agent; explicit null
  means root. Never infer another agent's parent when agent identity is supplied.
  Lifecycle accepts `activity_id`, `message`, `timestamp`, and `force` (default false).
  End with open children returns `{:error, {:open_children, list}}` unless forced.
  Message accepts `activity_id` (optional, infer within agent), `message`,
  `allow_stack_changes`. Status accepts `active_only` / `suspended_only` and
  optional authorized `thread_id` to inspect one thread's state and actions.
- Successful command result: `activity_id` and `event_id` when applicable,
  `state` containing the same camelCase status structure the CLI currently emits,
  `direction` (null for deterministic commands), `actions_applied` (list), and
  `closed_descendants` (list of `activity_id`, `activity_name`, `event_id`).
  Message also preserves existing assessment/reply/rationale/model result fields.
- Errors: `:not_found`, `{:invalid_input, message}`, `{:open_children, list}`,
  `:reducer_not_configured`, or existing reducer failure; adapters map errors safely.
- Service owns validation, authorized lookups, parent inference, writes, and live
  event broadcasts. Do not introduce HTTP calls between backend modules.
- `GET /api/agent-commands` advertises `{data: {version: 1, commands: [...]}}`.
  `POST /api/agent-commands` accepts `{command: "start", arguments: {...}}` and
  returns `{data: result}`. Both authenticated. Request agent headers override
  corresponding arguments when provided; arguments support direct MCP clients.
- MCP exposes `flambe_start`, `flambe_end`, `flambe_suspend`, `flambe_resume`,
  `flambe_status`, `flambe_message`, mapping to this same service. Preserve existing
  MCP message callers and discovery compatibility; validate protocol behavior.
- CLI probes capabilities once per client; 404/405 or the legacy server's 200
  HTML SPA fallback mean old/local fallback. Malformed JSON capabilities fail.
  Supported servers use commands for lifecycle/status/message with no client-side
  stack reconstruction. Preserve timestamps, explicit-root intent, offline aliases,
  reducer notes, and existing CLI output. Never retry a failed mutation via legacy
  endpoints. Local/old servers retain the existing path.
- State includes thread and activity `availableActions` from a deterministic,
  advisory transition model. These describe sensible next actions, with reasons
  and requirements (such as force when ending a parent with active descendants).
  They do not introduce new rejection of historical events or remove the app's
  resurrection behavior. Keep this separate from reducer `direction`.
  Lifecycle state ignores reducer bookkeeping events. Suspended ancestors suppress
  inappropriate child suggestions; resurrected work counts as running. Suggested
  action arguments carry the thread/activity context needed to apply them.

## Ownership and verification

1. Backend domain agent: AgentCommands module and domain tests only.
2. Transport agent: MCP/REST controllers, router, transport tests only.
3. CLI agent: cli/src/client.mjs and CLI tests only.
4. Coordinator: ADR, README/skills, integration review, checks and fixes.

Validate tenant isolation, explicit root vs inference, concurrent agent identity,
end/force behavior, missing model configuration, live broadcasts, MCP discovery
and errors, old-server fallback and offline replay. Run CLI tests and backend
precommit. No deployment or commit is part of this implementation.

## Completion

Implemented by three Sol agents, with coordinator integration review. CLI tests:
46 passed. Backend `mix precommit`: 83 tests passed, compilation and formatting
passed. Cross-adapter tests exercise MCP start followed by REST status/end and
live broadcasts. Legacy HTML discovery fallback, queued force preservation,
reducer message authority, and suspended-parent inference were corrected during
review. Changes are local; no deployment or MCP client configuration performed.
