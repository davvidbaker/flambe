# ADR-002: Menu-bar flame represents recent agent communication

## Status

Accepted

## Context

ADR-001 made the macOS flame binary: it represented only Flambe server
connectivity. David wants the flame to be partially active while one agent is
communicating successfully, and fully active while two or more agents are.

## Decision

Flambe tracks each bearer-token agent that completes a successful API request
for 30 seconds. The native menu-bar helper polls an authenticated status
endpoint and renders zero, one, or two-or-more active agents as an outline,
orange flame, or blue sparkling flame, respectively.

## Rationale

David selected the 0/1/2+ mapping. Bearer API tokens already identify the
agent clients without persisting raw credentials or adding a new credential
type.

## Alternatives considered

- Keeping the binary health indicator from ADR-001. It cannot distinguish the
  number of communicating agents.
- Persistent agent-presence records. Recent communication is transient state,
  so it is kept in the application process instead.

## Consequences

Presence resets if the backend restarts. A long-running agent needs to make a
successful Flambe API request at least once per 30 seconds to remain active.
The helper's own polling is excluded from presence tracking.
