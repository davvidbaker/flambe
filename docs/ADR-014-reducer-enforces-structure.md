# ADR-014: One reducer ingress; the reducer enforces structure by rewriting

## Status

Accepted. Extends [ADR-011](ADR-011-reducer-owns-the-stack.md) (single writer,
reinterpret never drop) and [ADR-012](ADR-012-reducer-places-work-and-names-agents.md)
(server-side `start` resolution). Closes ADR-011's "not yet": model review when a
structural rule fires, and `direction` on lifecycle events. Keeps
[ADR-013](ADR-013-shared-agent-commands-and-mcp.md)'s shared command service and
[ADR-010](ADR-010-reducer-advises-worker-owned-stack.md)'s rule that a `direction`
is binding for the worker.

## Context

Tracing a `flambe_message` through `POST /mcp` showed the control plane is split:

- Worker mutations enter through three doors: `POST /api/agent-commands` and `/mcp`
  (via `FlambeNext.AgentCommands`), and bearer `POST /api/activities` /
  `/api/events` (calling `FlambeNext.Reducer` directly). The same invariants are
  applied only on whichever path happens to be used.
- Two reducers exist. `FlambeNext.Reducer` folds lifecycle events deterministically
  and never returns a `direction`. `FlambeNext.ReducerAgent` runs the model, sees the
  whole stack, and can steer, but only when a worker volunteers a `message`.
  Nothing judges a `start` or `end` against the rest of the flame.

David's reading, after discussion: Flambe's "global intent" is not a thing to store.
It is inferred from the **root activity** of the stack a worker is in. Threads are
placement, not meaning. A vague root ("Cursor session") is allowed and the reducer
should stay quiet about it. The gap is not missing intent; it is that the reducer's
judgment never runs on the lifecycle path, and that the reducer cannot correct
structure except in one case (forced `end`).

David's priority for the reducer is **structure**: enforce it and guide the agents.
Meaning, time, multiplicity, and human-correction signals were discussed and set
aside for now.

## Decision

1. **One ingress.** Every worker-originated mutation (`start`, `end`, `suspend`,
   `resume`, `message`) enters `FlambeNext.AgentCommands`, whichever transport it
   arrives on. Bearer `POST /api/activities` and `/api/events` become thin adapters
   over it; their URLs and response shapes stay for local `flambe serve` and older
   CLIs. Browser (session) edits keep writing directly: human > reducer > workers.
2. **One reducer.** The deterministic fold and the model review are stages of one
   pipeline, not two modules with different callers. Every command result may carry
   `direction` and `reply`, not only `message`.
3. **The reducer rewrites.** When a worker's proposal breaks the structure, the reducer
   records the proposal (ADR-011: never refuse) and then corrects the stack around it:
   re-parent, close, resume, rename, or treat as a duplicate. The response tells the
   worker what changed. The chart's structure no longer depends on the worker obeying.
4. **Structural rules.** The reducer enforces these on each proposal:
   1. *One open leaf per agent.* A `start` without an explicit root nests under the
      agent's own newest open activity; an explicit `parent_id` elsewhere is recorded
      and judged (rule 5 territory).
   2. *New root while a leaf is open* is recorded as a root, then judged by the model:
      it may stay a root, or be re-parented under the open leaf or the previous root.
      "It's fine" is a valid answer.
   3. *Ending a parent closes its open descendants* (ADR-011, unchanged).
   4. *Ending a leaf pops to the parent.* No rewrite; the response names the parent
      that is now the agent's active activity.
   5. *A child whose name does not fit its ancestors.* Model-judged and deliberately
      cautious, because a poor name is likelier than a wrong parent. The reducer's
      first tool is the reply: ask the worker for a better name or description, or
      rename when the tree makes the meaning obvious. It re-parents only on structural
      evidence (the worker's own words say it moved on; the child duplicates an
      existing activity elsewhere). Otherwise it leaves the structure alone.
   6. *Same agent, same name, already open* is a duplicate: the proposal becomes a
      resume or a no-op on the existing activity, not a new one.
   7. *Child under a suspended ancestor* resumes the ancestor rather than creating
      running work under paused work.
   Rules 1, 3, 4, 6, 7 are deterministic and run without a model. Rules 2 and 5
   invoke the model.
5. **Model review is synchronous when it fires.** Rules 2 and 5 are rare; when one
   fires, the worker waits for the model on that call and receives `direction` /
   `reply` in the same response. All other lifecycle calls stay deterministic and
   fast. If the model is unconfigured or fails, the deterministic result is returned
   with no direction; nothing is dropped.
6. **A clarification round trip is part of the protocol.** The reducer may answer a
   proposal with a question (rule 5). The worker answers with `message` or by
   renaming. `message` remains the worker's own channel for updates and answers.
7. **Escalation stays a relayed reply.** `direction: escalate` is returned to the
   worker, which surfaces it to David. No inbox, table, or SPA surface is added.
8. **The protocol lives in the skill, with a louder CLI.** The `flambe-cli` skill
   changes from "check `direction` after `message`" to "every command may return a
   direction or a question; act on it before the next step." The CLI prints
   `direction`, `reply`, and rewrites on every command, and reminds the agent on the
   next call if a question went unanswered. The CLI does not refuse commands.

## Rationale

- Rewriting rather than pushing back was David's choice; it makes the chart correct
  independent of agent obedience, which ADR-010 flagged as unverified.
- Intent-from-root avoids a manual field David does not want to maintain, and the
  reducer already receives ancestors, siblings, and the full stack.
- Synchronous review follows from the clarification round trip: a question is only
  useful in the response that recorded the proposal. ADR-012's rejection of 3–9 s per
  `start` still holds for the common case, which stays deterministic.
- Rule 5's caution is David's: agents often describe their work poorly, so moving an
  activity on the strength of its name would usually fix the wrong thing.
- Skill over CLI gating: with rewriting in place, only the soft protocol (reading
  replies, answering questions) depends on the agent, and that is the trust already
  extended today.

## Alternatives considered

- **Store global intent** on the trace (and optionally per thread) and feed it to the
  model. Rejected by David: he does not want to specify intent manually; the root
  activity already expresses it.
- **Reducer pushes back only** (record as-is, return a direction, worker fixes its own
  stack). Rejected as the default in favour of rewriting; the direction/reply channel
  is kept for guidance and questions.
- **Asynchronous model review with directions delivered on the next call.** Rejected
  for rules 2 and 5 because a clarifying question must arrive in the same response.
- **CLI refuses the next command while a question is unanswered.** Rejected: it would
  make the CLI an enforcer and sit on the wrong side of "never refuse". Revisit if
  agents demonstrably ignore questions.
- **Escalation inbox / table / menu-bar surface.** Not selected now; David is content
  with the reply being relayed by the worker.

## Consequences

- The legacy REST write path and MCP produce identical structure, because both fold
  through the same pipeline.
- Rare `start`s become slow (model call). Workers and the skill must tolerate a
  question in a `start` response.
- The reducer may re-parent, rename, or convert a worker's proposal into a resume; the
  worker learns of it from `actions_applied` and must treat the returned state as
  truth. Activity ids printed by the CLI stay valid.
- Local `flambe serve` keeps its legacy semantics until it gains the deterministic
  pipeline (still open from ADR-011).

## Not yet

- Meaning-level drift (names vs. intent beyond rule 5), time-based signals (stale or
  trivially short activities), multiplicity (duplicate work across agents; agent roots
  nesting under the human's activity), and treating human SPA edits as feedback to the
  reducer. Discussed; not decided.
- Re-placing a root when its name changes (ADR-012).
- Deterministic pipeline in local `flambe serve` (ADR-011).

## Follow-ups

- `PLAN-reducer-structure.md` for phasing, ownership, and verification.
- Update `.cursor/skills/flambe-cli` and `.codex/skills/flambe-cli` together.
