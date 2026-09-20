# Open work

Unfinished Flambe work and follow-ups that live in other repos. Parked ideas
stay in a `docs/deferred-*.md` note until someone asks to implement them.

Shipped observations: [ADR-008](ADR-008-generic-observations.md). Local
Node+SQLite: [ADR-009](ADR-009-local-node-sqlite-and-on-demand-import.md).

## In progress

- [ADR-014](ADR-014-reducer-enforces-structure.md) / [PLAN-reducer-structure.md](PLAN-reducer-structure.md):
  one worker ingress, one reducer, structure enforced by rewriting. Skills,
  README, and MCP descriptions were updated first.

## Follow-ups

- Re-place an activity when its name changes
  ([ADR-012](ADR-012-reducer-places-work-and-names-agents.md)).
- Whether agents actually obey a returned `direction`. The skill is the only
  client-side enforcement; [ADR-011](ADR-011-reducer-owns-the-stack.md) enforces
  structure server-side. `direction` stays advisory until the model path runs
  on lifecycle events (ADR-014).
- **Pulse `carbon/`** — Dagster OSS posting daily US grid intensity as
  `kind=carbon`. Deploy and enable `daily_us_carbon_schedule` (see that repo).
- **Pulse** — after a day closes, electricity kWh × that day’s intensity →
  kgCO₂; merge `kwh_actual` / `kgco2_estimated` / `kgco2_error` onto the same
  observation payload.
- **Chart** — render observations (carbon, later mood) on the timeline.
  ADR-008 left this out.
- **Moods** — same observation primitive (`kind=mood`, omit `observed_on`).
  No CLI or UI beyond `flambe observe` yet.

Reducer model ids default to `gpt-5.6-luna` / `gpt-5.6-terra`
(`FLAMBE_REDUCER_PRIMARY_MODEL` / `FLAMBE_REDUCER_ESCALATION_MODEL`). Phoenix
needs `OPENAI_API_KEY` for `flambe message` and async root placement; do not
commit it.

## Parked (do not implement until asked)

- [Deferred: SPA effects without sagas](deferred-spa-async.md)
