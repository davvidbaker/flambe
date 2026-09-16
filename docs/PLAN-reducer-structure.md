# Reducer enforces structure: implementation plan

Implements [ADR-014](ADR-014-reducer-enforces-structure.md). David authorized
drafting this plan and delegating implementation to subagents after reviewing the
ADR. Nothing here changes what ADR-014 decided; it phases it.

## Target shape

```
worker (CLI | MCP | legacy REST)
   │ proposal: start / end / suspend / resume / message
   ▼
FlambeNext.AgentCommands.execute          ← only worker ingress
   ▼
FlambeNext.Reducer.fold(user, trace, proposal)
   1. deterministic fold  (rules 1, 3, 4, 6, 7; today's Reducer)
   2. structural check    → [%{rule: "new_root_while_open", fired: true}, …]
   3. model review        (only if a model rule fired, or command == message)
   4. result: %{state, activity_id, event_id, actions_applied,
                closed_descendants, rules_fired, direction, reply, question?}
```

## Shared contract

- `FlambeNext.Reducer` becomes the one reducer. Today's `Reducer` (deterministic) is
  its first stage; today's `ReducerAgent` becomes its review stage (`Reducer.Review`
  or similar). `ReducerAgent.place_root_async/2` and the placement prompt move with
  it unchanged. Public entry: `Reducer.fold/3` returning `{:ok, result} | {:error, reason}`.
- `AgentCommands` calls `Reducer.fold` for every command and builds the response
  from its result. It no longer calls `Reducer.reduce_start`, `reduce_event`, or
  `ReducerAgent.handle` directly.
- Every command result gains `direction` (string or null), `reply` (string or null),
  and `rules_fired` (list of `%{rule, applied}`). `actions_applied` gains the new
  rewrite kinds: `reparent`, `resume_existing`, `resume_ancestor`, `rename`,
  `no_op`. Existing keys (`state`, `activity_id`, `event_id`, `closed_descendants`)
  are unchanged.
- Rule detection is data, not prose. Each fired rule writes a `reducer_decision`
  event on the affected activity (`"rule=new_root_while_open | applied=reparent:41 | …"`)
  so the chart shows why a rewrite happened. Bookkeeping phases stay non-lifecycle.
- Model stage takes an injectable `llm` (as `place_root/3` does) so tests never hit
  the network. Prompt receives the same context as today plus the proposal, the fired
  rule, and the root activity named as the intent. Allowed actions extend
  `create_child` / `update_activity` / `no_op` with `reparent` (to an existing id) and
  `ask` (a question in `reply`). At most one action, validated against real ids.
- Model unconfigured or failing → deterministic result, `direction: nil`, logged.
  Nothing dropped.
- Bearer `POST /api/activities` and `POST /api/events` call `AgentCommands.execute`
  and map its result back to their existing response shapes (`data.activity`,
  `data.reducer`, `data.id`, `data.reducer.closed_descendants`). Session (SPA) writes
  are untouched.
- `/mcp` `tools/call` and `POST /api/agent-commands` are unchanged as transports;
  they pass through the new result keys.

## Phases

### Phase 1 — one ingress, one reducer (no new rules)

Backend only. Merge `ReducerAgent` into `Reducer` as a review stage; route bearer
REST through `AgentCommands`; add `direction` / `reply` / `rules_fired` to every
result with today's behaviour (only `message` reaches the model). All existing
backend tests pass; cross-adapter tests (`reducer_start_test`, `agent_commands_test`,
`mcp_controller_test`, `agent_command_controller_test`) extended to assert the
legacy REST path produces the same events as `agent-commands`.

### Phase 2 — deterministic rules

Rules 4, 6, 7 (1 and 3 exist). `end` on a leaf reports the parent now active.
`start` of an already-open same-name activity for the same agent → `resume_existing`
(R event if suspended, `no_op` if running). `start` under a suspended ancestor →
`resume_ancestor` chain, then the B event. Tests per rule, including tenant isolation
and the no-model path.

### Phase 3 — model rules, synchronous

Rule 2 (new root while own leaf open) and rule 5 (child does not fit ancestors).
Detection is deterministic; judgment is the model. Rule 2 outcomes: keep root,
reparent under open leaf, reparent under previous root. Rule 5 outcomes, in order of
preference: `ask`, `rename`, `reparent` (only on structural evidence), `no_op`.
Tests with an injected `llm` covering each outcome, invalid model output, timeout →
deterministic fallback.

### Phase 4 — adapters and protocol

- CLI: print `direction`, `reply`, and every `actions_applied` entry on **all**
  commands (today only `message` and closed descendants). Remember an unanswered
  question per activity in `~/.flambe/` and remind on the next command; never refuse.
  Hosted `message` uses `agent-commands` only (drop the direct `/mcp` fallback when
  the server advertises commands). Legacy `/api/events` path kept for local/old servers.
- Skills: `.cursor/skills/flambe-cli/SKILL.md` and `.codex/skills/flambe-cli/SKILL.md`
  in sync: every command may return a direction or question; act before the next
  step; answer questions with `flambe message`.
- MCP tool descriptions mention that any tool may return `direction` / `reply`.

## Ownership

1. **Backend domain agent** — phases 1–3: `lib/flambe_next/reducer*.ex`,
   `lib/flambe_next/agent_commands.ex`, controllers' bearer branches, backend tests.
   Delivers phase 1 first as a checkpoint.
2. **CLI agent** — phase 4 CLI: `cli/src/client.mjs`, `cli/src/cli.mjs`, CLI tests.
   Starts after phase 1 lands (needs the result keys).
3. **Docs/skills agent** — phase 4 skills and MCP descriptions, README hosted-agent
   section, `docs/README.md` index, `OPEN_WORK.md`.
4. **Coordinator** — integration review, `mix precommit`, `npm test` in `cli/`,
   one live round trip against Fly after deploy.

## Verification

- `cd backend && mix precommit`; `cd cli && npm test`.
- Cross-adapter: MCP `flambe_start` → legacy REST `end` → same closures and
  `rules_fired` as via `agent-commands`.
- No-key path: every lifecycle command records with `OPENAI_API_KEY` unset.
- Live: start a root while a leaf is open on Fly; confirm the response carries a
  direction and the chart shows a `reducer_decision` event.

## Out of scope (ADR-014 "Not yet")

Meaning/time/multiplicity rules, human-edit feedback, escalation inbox, local
`flambe serve` pipeline parity, re-placing on rename.
