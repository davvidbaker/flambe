# ADR-003: Storybook demonstrates the app flame chart from fixtures

## Status

Accepted

## Context

Storybook lived in `frontend/packages/flame-chart` and rendered a rewritten
generic canvas, while the Flambe app still rendered
`packages/core/src/components/FlameChart.tsx`. The two surfaces diverged after
the standalone renderer failed to replace the app chart.

David decided Storybook should show the real app chart and must not talk to the
backend.

## Decision

Storybook belongs to the Flambe frontend. It renders the production Timeline /
FlameChart through a Redux store seeded with fixture trace data. Sagas, Phoenix,
and network requests are omitted.

The standalone `@davvidbaker/flame-chart` package is not the Storybook surface
for Flambe UI work.

## Rationale

David chose the production chart so Storybook cannot drift from what the app
shows. Fixture state is the way to do that without a running backend.

## Alternatives considered

- Delete Storybook until the production renderer is extracted.
- Render the standalone package in Storybook and migrate the app onto it later.
  That already failed once when app visuals were restored.

## Consequences

Flambe chart work is exercised in Storybook against the same component the app
uses. The published package is no longer the component playground.

## Follow-ups

- Keep Storybook stories on fixture stores; do not import the production saga
  store.
