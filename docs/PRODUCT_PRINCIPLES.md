# Product principles

## Flambe is not an agent orchestration framework

Flambe should not compete with generic agent runtimes or orchestration frameworks.
Those systems already own execution mechanics such as tool invocation, agent spawning,
handoffs, retries, workflow graphs, and scheduling. Flambe should interoperate with
those systems rather than reimplement them.

Flambe's differentiated responsibility is the **intent/control/observability layer**
above agent execution:

1. Preserve the user's global intent for the flame.
2. Observe the work agents report and the current stack/tree of activities.
3. Keep that work legible as a flamechart rather than reducing it to opaque logs.
4. Reconcile new events against the current state.
5. Detect drift, duplication, missing work, or a stack that no longer reflects the
   user's intent.
6. Return a concrete direction when the work should change course.

The core loop is:

> **global intent → observed agent work → current flame → reducer judgment → direction**

The reducer agent is therefore a **control-plane primitive**, not a general-purpose
orchestrator. It reads incoming messages/events plus the current flame, decides how
the flame should change, and responds with a direction for the acting agent when
needed. The acting agent/runtime remains responsible for actually performing the
work.

This boundary is intentional. A crowded orchestration ecosystem makes Flambe more,
not less, useful if it stays composable: MCP, Claude Code, Codex, or another runtime
can execute work while Flambe provides a shared model of what the work means, where
it sits in the larger effort, and whether it is still aligned with the user's intent.

### Product test

When considering a new feature, ask:

> Does this help Flambe understand, represent, reconcile, or steer work against global
> intent, or are we rebuilding execution plumbing that belongs in an agent runtime?

Prefer the former. Integrate with the latter.
