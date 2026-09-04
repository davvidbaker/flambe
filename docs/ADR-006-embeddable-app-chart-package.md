# ADR-006: Publish Flambe’s production chart through `@davvidbaker/flame-chart/flambe`

## Status

Accepted

## Context

davidbaker-is-next already depends on `@davvidbaker/flame-chart`, but that export is a generic span canvas. David rejected restyling that demo as a fake Mac desktop. He wants a package that renders Flambe’s real flame chart from fixture/trace data (activities, events, threads), without login or Phoenix, so the personal site can depend on it instead of inlining a toy.

Storybook already does this: `ChartHarness` plus a Redux store seeded from an `AppChartFixture` (ADR-003). `flambe-core` is the private app workspace package and has no library build.

## Decision

Keep the published name `@davvidbaker/flame-chart`.

- Root export stays the generic `FlameChart` / `FlameSpan` renderer.
- `@davvidbaker/flame-chart/flambe` re-exports `ChartHarness` and the fixture types from `flambe-core`.
- `flambe-core` stays private. Do not publish the full app.

Local `file:` / path install is enough until npm credentials are used. Next.js consumers must load the embed on the client (`window`, canvas, `localStorage`).

## Rationale

David asked for Flambe’s chart as a package for the personal site, and for ChartHarness’s fixture shape as the public API. The npm name is already decided by this package’s `package.json` and by the site’s existing dependency. Replacing the generic export would break the 0.1.x span API; a subpath keeps both.

## Alternatives considered

- Publish `flambe-core` as the library. Rejected: it is the full app (login, sagas, Phoenix).
- New name (`@flambe/chart`). Unnecessary while `@davvidbaker/flame-chart` is already published and consumed.
- Point the personal site at core source via `file:` only. Workable locally, but leaves the already-public package as the toy.

## Consequences

Embed consumers depend on `@davvidbaker/flame-chart/flambe` and `styled-components`. Storybook remains the product playground (ADR-003). Publishing still uses the existing flame-chart workflow; it was not run from this change unless credentials were confirmed.

## Follow-ups

- Point davidbaker-is-next at a local build of this package (`createFrontiersFixture` + `ChartHarness`), then publish 0.2.0 when npm access is available.
