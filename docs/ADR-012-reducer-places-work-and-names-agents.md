# ADR-012: The reducer places new work and names agents

## Status

Accepted. Extends [ADR-011](ADR-011-reducer-owns-the-stack.md).

## Context

ADR-011 made the reducer the single writer for worker-originated changes, but `start`
still arrived fully formed: the CLI chose the thread (lowest rank), the parent (newest
active activity in that thread, whoever owned it), and the categories (none unless the
agent passed `--category`). Three consequences showed up in David's trace within a day:

- An agent's first `start` nested under another agent's open leaf. Activity 26 (a Cursor
  Cloud session) landed under 23 ("Watch main CI and Fly deploy", a different Cursor
  session) because parent inference ignored `agent_id`.
- Everything from every repo started on the default thread. Threads exist to separate
  workstreams ("flambé🔥", "R&D rewrite"), and only a human ever moved things.
- Almost nothing had categories. Agents were told not to fetch the category list.

Separately, agent lanes depend on `agent_name`, which the CLI takes from
`FLAMBE_AGENT_NAME`. Without it the server fell back to the API token name, so every
Cloud Agent sharing one token became a single "Cursor Cloud" lane; without either it
hashed the id into one of fifteen first names, per activity, with nothing telling the
agent what it had been called.

David: the reducer should make category decisions and make sure work is on the right
thread; async is fine; it may move a root; and an agent that is missing a name should be
given one and told, so it uses it from then on.

## Decision

1. **`start` is a proposal too.** For agent (bearer) requests the deterministic reducer
   resolves what the worker left open:
   - *Parent.* `parent_id` absent means "infer": the agent's own newest active activity
     anywhere in the trace; none → root. `parent_id: null` means root explicitly. An
     explicit id is validated. Inference no longer crosses agents.
   - *Thread.* A child lives in its parent's thread; the request's `thread_id` is
     ignored when a parent exists. A root with no `thread_id` goes to the lowest-rank
     thread.
   - *Categories.* None given → inherit the parent's. Roots start with none.
   The response reports what was inferred under `data.reducer`.
2. **Roots are placed by the model, asynchronously.** After a root is written, and only
   when a model is configured and there is a choice to make (more than one thread or any
   categories), the reducer asks the primary model for a thread and categories given the
   activity, the trace's threads, the user's categories, and the agent's recent work. It
   applies the answer (move subtree, set categories), records a `reducer_decision` event
   naming the original thread, and re-broadcasts the activity. `start` returns before
   any of this; the chart corrects itself a few seconds later. Failures are logged and
   change nothing.
3. **The server names agents.** An `agents` table maps `(user, agent_id)` to a name.
   The first request carrying an unknown `x-flambe-agent-id` without a usable
   `x-flambe-agent-name` gets a name that no other agent of that user has, persisted.
   Every agent request is answered with `x-flambe-agent-name`, plus
   `x-flambe-agent-name-assigned: true` on the request that coined it. A name the
   agent supplies wins and is stored. The API token name is no longer used as a lane
   name. `GET /api/agents/me` returns the caller's identity. The product an agent runs
   on is a separate label, `x-flambe-agent-platform` (`FLAMBE_AGENT_PLATFORM`, e.g.
   "Cursor Cloud"), stored on the agent; many agents share one platform.
4. **The CLI remembers.** It stores assigned names in `~/.flambe/agent-names.json` by
   `agent_id`, sends them on later requests, prints "this agent is now named X" on
   stderr when a name is coined, and gains `flambe whoami`. `FLAMBE_AGENT_NAME` becomes
   an override, not a requirement; the skill stops asking agents to export a product
   name.
5. **Local `flambe serve` follows the deterministic parts** (rules 1 and 3) so the
   CLI behaves the same offline; it has no model.

## Rationale

Parent inference is a stack rule and belongs where the stack is (ADR-011). Scoping it
to the agent is what "make sure we're on the right thread" means in practice for
nested work; for roots there is genuinely no rule, so that is where the model earns
its cost, and running it after the write keeps `start` fast and keeps logging working
when the key is missing. Naming is the reducer's job for the same reason categories
are: the worker doesn't know the rest of the flame, and a product name is not an
identity when many sessions share it.

## Alternatives considered

- **Synchronous placement on `start`.** Rejected by David: 3–9 s per root start.
- **Categorize without moving threads.** Rejected: a wrong thread is the more common
  and more visible problem.
- **Keep the token name as the lane name.** Rejected: one token per product means one
  lane per product.
- **Name agents with the model.** Rejected: names must be stable and available without
  a key; uniqueness is the requirement, not cleverness.

## Consequences

`start` no longer needs a `GET /api/traces/:id` first, so it is one request. Agents
should stop passing `--thread` and `--category` unless certain. Roots may move threads
shortly after creation; the CLI-printed id stays valid. Because `x-flambe-agent-name`
now wins when present, the Cloud secret is `FLAMBE_AGENT_PLATFORM=Cursor Cloud`, not
`FLAMBE_AGENT_NAME`, so cloud sessions get distinct names and a shared platform. Activities keep their own `agent_name` column, so a
later rename does not rewrite history.

## Not yet

- `direction` on lifecycle events and model review when a structural rule fires
  (still open from ADR-011).
- Re-placing an activity when its name changes.
