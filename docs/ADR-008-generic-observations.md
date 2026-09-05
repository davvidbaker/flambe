# ADR-008: Generic observation overlay

## Status
Accepted

## Context

Pulse will publish daily US grid carbon intensity (and later kgCO₂ plus forecast
error) into Flambe. Moods were discussed as a similar overlay. Flambe already
has human overlays (mantras, attentions, todos, tabs) that are not part of the
activity lifecycle. The CLI could only write activities. A carbon-only table
would force a second overlay later for moods.

David chose a generic observation primitive.

## Decision

User-scoped observations are a typed overlay, not activities:

- `kind` names the series (`carbon`, `mood`, …)
- `value` and optional `unit` are the primary measurement
- `payload` is a JSON map for series-specific fields
- `timestamp` is when the observation was recorded
- optional `observed_on` identifies a calendar day for that kind

When `observed_on` is set, create-or-update is unique per `(user, kind, day)`
and incoming `payload` keys merge into the existing map. Undated observations
always insert (point-in-time moods).

The CLI writes them with `flambe observe`. They stay out of the activity
begin/end model.

## Rationale

David selected a generic observation so carbon and moods share one primitive.
Daily identity exists so Dagster can post intensity and Pulse can later attach
kWh and forecast error to the same row.

## Alternatives considered

- Carbon-only table
- Reuse mantras (name + timestamp only)
- Activity events as the publish target
- Object storage instead of Flambe

## Consequences

Dagster+ and Pulse can post without inventing a second overlay. The CLI and
dashboard user payload grow. Chart rendering of observations is not part of
this decision.

## Follow-ups

- CLI `observe` and HTTP CRUD
- Dagster daily US intensity post
- Pulse kgCO₂ and forecast-error payload merge
