# ADR-013: Shared agent commands with MCP for hosted agents

## Status

Accepted. Supersedes ADR-010's choice of the CLI as the primary hosted agent
adapter. Keeps ADR-009's local runtime and ADR-011's reducer ownership.
Integrates ADR-012's parent/thread/category placement and durable agent naming.

## Context

The CLI reconstructs activity state and infers parents before REST writes, while
free-text messages use MCP. Activity creation and lifecycle events have different
backend entry points. Direct MCP clients cannot use the full agent workflow.

After reviewing this arrangement, the agent recommended MCP as the primary
hosted agent interface, REST for the browser, and a thinner CLI for shell and
local/offline work. David authorized planning and implementation with Sol agents.
He then asked whether the plan should include a state machine exposing sensible
next actions in a thread.

## Decision

- Introduce one backend agent-command service for start, end, suspend, resume,
  status, and message. It owns authorized lookups, default thread and parent
  selection, writes through existing domain/reducer functions, and live updates.
- Expose that service through MCP tools and an authenticated REST command
  endpoint. Browser editing keeps its existing REST behavior.
- Hosted CLI operations delegate to this service. Capability discovery preserves
  the existing local/older-server path and offline queue; failed mutations never
  fall back to a second write path.
- Return resulting state, applied changes, and reducer direction together.
  State includes advisory next actions derived deterministically from activity
  and thread state. This guidance is separate from model-generated direction.
- Preserve recorded event history and existing resurrection semantics. The
  transition model guides callers; it is not a new strict event rejection policy.

## Rationale

Centralizing decisions removes duplicated stack reconstruction from hosted
clients and makes MCP and CLI callers observe the same backend behavior. MCP
fits Flambe's agent-facing operations and structured feedback. The local SQLite
runtime and offline queue remain useful reasons to retain the CLI.

The advisory state model is the agent's implementation interpretation of David's
request: expose useful next actions without contradicting ADR-011's rule that
reported work must remain recorded.

## Alternatives considered

- Retain CLI/REST as the primary hosted agent interface: reconsidered because
  domain decisions currently live in the client and direct MCP support is partial.
- Replace the CLI and REST entirely: not selected; the browser and local/offline
  workflows still use them.

## Consequences

MCP clients still need authentication, trace and per-worker identity context,
and behavioral instructions about when to report work and follow guidance.
The local runtime retains legacy semantics until separately upgraded. This
change does not deploy the hosted server or configure users' MCP clients.
