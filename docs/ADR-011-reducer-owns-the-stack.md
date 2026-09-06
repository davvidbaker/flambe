# ADR-011: The reducer owns the stack; workers propose transitions

## Status

Accepted. Supersedes decision 1 of [ADR-010](ADR-010-reducer-advises-worker-owned-stack.md)
("the worker owns its stack"). ADR-010's other decisions stand: the CLI is the adapter,
a `direction` is binding, `flambe message` is the channel for free-text updates.

## Context

ADR-010 gave the writer role to the worker because that is what the CLI already did:
`flambe start` / `end` post straight to `/api/activities` and `/api/events`, and the
structural rules (infer the parent, refuse to end a parent with open children) live in
the CLI. The reducer could only advise, and `allow_stack_changes: false` was added so
two writers never edited one flame.

David questioned that framing: workers should be stack-aware and traverse back up when
they finish, but the backend reducer is the thing that owns the stack. Flambe named the
component a reducer for a reason. Workers dispatch; the reducer folds those dispatches
into state; the database is the state.

Two questions were put to David and answered:

- May the reducer refuse a worker event? **No, only reinterpret.**
- Does the deterministic path run when no model is configured? **Yes.**

## Decision

1. **The reducer is the single writer for worker-originated changes.** A worker
   proposes a transition (`start`, `end`, `suspend`, `resume`, or a `message`); the
   reducer records it. Workers still decide what to push and are responsible for popping
   back up, but they propose, they do not write.
2. **Two paths, one module.**
   - *Deterministic*: lifecycle events reduce without a model. Validate structure,
     enforce the stack invariants, record. This is also what the offline queue replays
     into, and it must work with no `OPENAI_API_KEY`.
   - *Model*: runs for free-text `message`s and, later, when a structural rule fires
     (ending a root with open children, starting a new root while a leaf is open, a name
     that does not fit its ancestors). Then the reducer may return a `direction` on any
     event, not only on `message`.
3. **Reinterpret, never drop.** If a worker says work happened, the chart records it. The
   reducer may re-parent, rename, close, or annotate; it may not refuse the fact. The
   first deterministic rule: ending an activity whose descendants are still open also
   ends those descendants, each with a reducer-authored message naming the parent, and
   the response lists what was closed.
4. **Human > reducer > workers.** SPA edits go direct. The reducer prompt already
   forbids changing global intent; `escalate` is how it asks the human.
5. **`allow_stack_changes: false` becomes opt-in, not the CLI default.** The CLI
   sends `flambe message` with stack changes allowed; a proposed `create_child` or
   `update_activity` is applied by the reducer as the single writer. The flag stays on
   `/mcp` for callers that want advice only.

## What changes now

- `FlambeNext.Reducer` (deterministic) sits behind `POST /api/events` for
  bearer-authenticated (agent) requests. Ending an activity closes its open descendants
  (deepest first, same timestamp) and the response carries
  `data.reducer.closed_descendants`.
- The CLI prints those closures on `flambe end`, and prints reducer actions on
  `flambe message`.
- The CLI keeps its pre-flight "open children" check as a worker-side nudge (the worker
  is asked to pop explicitly; `--force` sends anyway). Nothing is dropped by it: no event
  has been proposed yet. It can go once local `flambe serve` gains the deterministic
  reducer; until then it is the only enforcement local mode has.

## Not yet

- Routing `start` through server-side parent inference. The CLI omits `parent_id` both
  for `--root` and for "no active parent"; the server cannot tell those apart today.
- The model review when a structural rule fires, and `direction` on lifecycle events.
- The deterministic reducer in local `flambe serve` (ADR-009).

## Alternatives considered

- **Keep ADR-010 as written.** Rejected: it left the CLI as the real writer and put
  structural rules in the client, duplicated per client.
- **Route every lifecycle event through the model.** Rejected: 3–9 s and one or two
  OpenAI calls per `start`/`end` for what are pure state transitions, and a missing key
  would stop all logging.
- **Let the reducer refuse events.** Rejected by David: the chart stops being an honest
  record.
- **New `/mcp` lifecycle tools instead of the REST endpoints.** Deferred: `flambe serve`
  implements the REST contract and would break; the reducer can sit behind the same
  endpoints.

## Consequences

Structural rules move server-side once and apply to every client, not only the CLI.
Agents that `--force` an end no longer leave dangling children. The reducer may now
edit a CLI-driven worker's activities in response to a `message`; the worker learns of
it from `actions_applied`. Any `E` event from an agent can fan out into several events.
