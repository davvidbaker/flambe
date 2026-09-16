# ADR-010: The Reducer Agent advises; the worker owns its stack

## Status

Accepted. Decision 1 ("the worker owns its stack") is superseded by
[ADR-011](ADR-011-reducer-owns-the-stack.md); decisions 2–4 stand, except that the CLI
no longer sends `allow_stack_changes: false`.
Decision 3 (the CLI as the primary hosted adapter) is superseded by
[ADR-012](ADR-012-shared-agent-commands-and-mcp.md).

## Context

[#90](https://github.com/davvidbaker/flambe/pull/90) added a Reducer Agent behind
`POST /mcp`. Given a worker message and the whole flame, it returns an assessment, an
authoritative `direction`, a short reply, and may apply at most one stack mutation
(`create_child`, `update_activity`, or `no_op`).

Coding agents in Cursor, Codex, and Claude Code already write the stack themselves with
the `flambe` CLI (`start` / `end` / `suspend` / `resume`, REST). Nothing called the
reducer, so it could never disagree with anyone. Wiring it in raised an ownership
question: if the reducer also edits activities, two writers act on the same flame.

David's stated intent: the reducer should see what a worker sent, potentially disagree,
and send something back that alters the worker's course — mostly for his own Cursor
sessions.

## Decision

1. **The worker owns its stack.** `flambe start`/`end` remain the only way a CLI-driven
   agent's activities are created and closed.
2. **The reducer advises.** The CLI gains `flambe message "<update>"`, which calls
   `POST /mcp` `flambe_message` with `allow_stack_changes: false`. The reducer keeps
   `assessment` / `direction` / `reply`; any proposed stack mutation is dropped
   server-side.
3. **The CLI is the adapter.** Cursor is not configured as an MCP client. The CLI already
   has the URL, token, trace, and agent identity from `.env`, and picks the agent's newest
   active activity by default.
4. **A `direction` is binding for the worker.** The `flambe-cli` skill tells agents when
   to message (widening scope, changing approach, ending a root workstream, suspected
   drift) and to stop and surface `pause` / `stop` / `escalate` to David.

`/mcp` keeps `allow_stack_changes` defaulting to `true` for workers that do not maintain
their own stack.

## Rationale

David chose the "worker owns, reducer advises" shape after being shown three options.
The single-writer rule avoids the CLI and the reducer fighting over the same activities.
Routing through the CLI (agent-suggested) avoids putting the API token into Cursor's GUI
process and sidesteps Cursor's current handling of static headers on remote MCP servers;
it also gives Codex and Claude Code the same behaviour for free.

## Alternatives considered

- **CLI only, no reducer calls.** Rejected: the reducer would exist but never steer anyone.
- **Cursor as a direct MCP client (`mcp.json`).** Set aside: token handling in the editor
  process and no way to load `.env`; the CLI already carries the credentials.
- **Reducer owns the stack; workers only send messages.** Rejected for now: a bigger shift
  that would replace the working CLI skill.

## Consequences

Agents get a second channel that can contradict them mid-task. The reducer only sees the
stack and the message, not code or conversation, so its judgement is about intent and
scope drift. Each call is one or two OpenAI requests; the skill limits when to call.
Local `flambe serve` (ADR-009) has no reducer.

## Follow-ups

- Watch whether agents actually obey `direction`; the skill is the only enforcement.
- Reconsider reducer-owned stacks if autonomous workers without the CLI appear.
