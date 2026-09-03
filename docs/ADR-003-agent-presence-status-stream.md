# ADR-003: Deliver menu-bar agent presence over Server-Sent Events

## Status

Accepted

## Context

ADR-002 used a five-second status poll from the menu-bar helper. The helper
only needs changes to the recent agent count, and the regular polling creates
unnecessary backend requests and log noise.

## Decision

The helper keeps one authenticated Server-Sent Events (SSE) connection to an
agent-presence stream. The backend sends the current count when it connects,
then sends updates when an agent becomes active or its 30-second presence
expires. If the stream disconnects, the helper shows the unavailable state and
tries to reconnect after five seconds.

## Consequences

Each running helper uses one long-lived HTTP connection instead of twelve
status requests per minute. The stream itself is excluded from presence
tracking, so it never makes the flame appear active. Presence remains
in-memory and therefore still resets when the backend restarts.
