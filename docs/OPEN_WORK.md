# Open work

This is the index for unfinished Flambe work and follow-ups that live in other
repos. Parked ideas stay here or in a `docs/deferred-*.md` note until David
asks to implement them.

Observations (`kind` + `value` + `payload`) shipped on `main` in
[`6c4f61f`](https://github.com/davvidbaker/flambe/commit/6c4f61f). See
[ADR-008](ADR-008-generic-observations.md). Local Node+SQLite mode is
[ADR-009](ADR-009-local-node-sqlite-and-on-demand-import.md).

## Follow-ups (other repos / later Flambe)

1. **`/Users/david/code/pulse-carbon`** — Dagster location that posts daily US
   grid intensity as Flambe `kind=carbon`. Scaffold exists, **not a git repo
   yet**. Next: `git init`, GitHub remote, Dagster+ deploy, set `FLAMBE_URL` /
   `FLAMBE_API_TOKEN`, enable `daily_us_carbon_schedule`. README is in that
   directory.
2. **Pulse** (`/Users/david/code/pulse`) — after a day closes, electricity kWh
   × that day’s intensity → kgCO₂; merge `kwh_actual` / `kgco2_estimated` /
   `kgco2_error` onto the same observation payload.
3. **Flambe chart** — render observations (carbon, later mood) on the timeline.
   ADR-008 explicitly left this out.
4. **Moods** — same observation primitive (`kind=mood`, omit `observed_on`).
   No CLI or UI beyond `flambe observe` exists yet.

## Parked (do not implement until asked)

- [Deferred: SPA effects without sagas](deferred-spa-async.md)
