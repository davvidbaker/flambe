# ADR-001: Menu-bar indicator reflects Flambe server connectivity

## Status

Accepted

## Context

Flambe is currently a browser application. David wants a small macOS menu-bar
flame that shows when the application is up and successfully communicating
with Flambe.

## Decision

Provide a separate native macOS menu-bar helper. It polls Flambe's existing
unauthenticated `GET /api/health` endpoint every five seconds. The helper shows
a filled flame after a successful response and an outlined flame otherwise.

## Rationale

David selected connection status rather than remote-agent activity as the
meaning of the icon. The existing health endpoint provides that signal without
adding agent-presence state or a new authenticated protocol.

## Alternatives considered

- Agent heartbeats and presence. This would represent an actively
  communicating remote agent, but David did not select that meaning.
- Adding the status item to the browser application. A browser application
  cannot own a native macOS menu-bar item.

## Consequences

The icon indicates only that the helper can reach the configured Flambe server.
It does not indicate that an agent is working. The helper must be launched on
the Mac whose menu bar should display it.
