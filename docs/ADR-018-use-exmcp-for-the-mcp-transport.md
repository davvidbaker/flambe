# ADR-018: Use ExMCP for the MCP transport

## Status

Accepted.

## Context

Flambe exposes its shared agent-command service as MCP tools through a custom
Phoenix controller. The application boundary is sound, but the controller only
partially implements the final MCP `2026-07-28` wire protocol. Its discovery
response, per-request metadata validation, HTTP statuses, and protocol error codes
can fail with conforming clients or gateways.

Maintaining both the modern stateless protocol and the legacy initialization era
inside Flambe would duplicate protocol work that is available in an Elixir
library. Flambe still needs its existing bearer-token authentication, agent
identity headers, tenant authorization, and command behavior.

## Decision

Use `ex_mcp` 1.x as the MCP protocol and Streamable HTTP adapter. Mount
`ExMCP.HttpPlug` in the existing authenticated Phoenix pipeline and implement a
Flambe handler that delegates tool calls to `FlambeNext.AgentCommands`.

Pass the authenticated user and resolved agent identity to the handler through
`ExMCP.HttpPlug`'s request-derived `handler_opts`. Keep authentication and tenant
authorization owned by Flambe; do not adopt ExMCP's OAuth subsystem as part of
this migration.

Require bearer API-token authentication at `/mcp`. Browser sessions remain valid
for browser and REST routes but are not credentials for the external MCP endpoint.

Run ExMCP in dual-era, modern-preferred mode during the transition so current
legacy-shaped callers continue to work. Remove the custom `McpController` after
equivalent behavior and protocol conformance are verified.

## Rationale

- MCP remains an adapter over the shared command service rather than owning domain
  behavior.
- ExMCP supports Phoenix, MCP `2026-07-28`, legacy negotiation, request-derived
  handler context, and official conformance testing.
- Keeping Flambe authentication outside the library preserves the current API
  token and session behavior and avoids coupling this transport migration to an
  OAuth migration.
- Token-only MCP authentication makes the external agent boundary explicit and
  avoids ambient browser sessions authorizing tool calls.
- Dual-era operation gives the CLI fallback and existing configured clients a
  compatibility window.

## Alternatives considered

- Continue repairing the custom controller. This keeps the dependency surface
  smaller, but leaves Flambe responsible for protocol negotiation, transport
  security, result envelopes, subscriptions, and future MCP revisions.
- Use `backplane_mcp_protocol`. It supports the required protocol and Phoenix
  integration, but ExMCP has broader adoption and an MIT license.

## Consequences

- Flambe gains a protocol dependency and must track compatible ExMCP 1.x updates.
- Tool definitions move from controller clauses into a handler/registry while
  `AgentCommands` remains unchanged.
- A dedicated Phoenix authentication pipeline runs before ExMCP and accepts only
  API tokens. The handler treats the captured user and agent context as
  authoritative over model-supplied identity arguments.
- ExMCP owns MCP framing, discovery, negotiation, headers, error envelopes, and
  Streamable HTTP behavior. Flambe owns command validation and tool execution
  errors.
- OAuth 2.1 discovery and dynamic client authorization remain out of scope.

## Follow-ups

- Implement and verify the phases in `PLAN-exmcp-transport-migration.md`.
- After a compatibility window, decide whether to remove legacy protocol support
  and the CLI's direct MCP fallback.
