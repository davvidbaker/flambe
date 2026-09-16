# Open work

This is the index for unfinished Flambe work and follow-ups that live in other
repos. Parked ideas stay here or in a `docs/deferred-*.md` note until David
asks to implement them.

Observations (`kind` + `value` + `payload`) shipped on `main` in
[`6c4f61f`](https://github.com/davvidbaker/flambe/commit/6c4f61f). See
[ADR-008](ADR-008-generic-observations.md). Local Node+SQLite mode is
[ADR-009](ADR-009-local-node-sqlite-and-on-demand-import.md).

## Last left (2026-09-16)

- [ADR-014](ADR-014-reducer-enforces-structure.md) accepted: one worker ingress,
  one reducer, structure enforced by rewriting; every command may return
  `direction` / `reply` / `actions_applied`. Implementation is in progress per
  [PLAN-reducer-structure.md](PLAN-reducer-structure.md) (phases 1–4; skills,
  README, and MCP descriptions updated first).

## Previously left (2026-09-06)

Paused for ~two weeks. Production is `https://flambe.fly.dev`. A push to
`main` deploys after Modernization validation is green
([RELEASE_CHECKLIST](RELEASE_CHECKLIST.md)).

Shipped on `main` the same day:

- [#89](https://github.com/davvidbaker/flambe/pull/89) mobile chart layout
  (`100dvh`, compact header, Playwright 390×844)
- [#90](https://github.com/davvidbaker/flambe/pull/90) MCP Reducer Agent:
  authenticated `POST /mcp`, one `flambe_message` tool, at most one stack
  mutation per message (`create_child` / `update_activity` / `no_op`)

- [#91](https://github.com/davvidbaker/flambe/pull/91) `:inets` in the release;
  without it the reducer could not reach OpenAI on Fly
- `OPENAI_API_KEY` is set on Fly; a live `flambe_message` round-trip succeeded
- `flambe message "<update>"` + [ADR-010](ADR-010-reducer-advises-worker-owned-stack.md):
  the CLI asks the reducer for direction
- [ADR-011](ADR-011-reducer-owns-the-stack.md): the reducer owns the stack.
  Deterministic path behind `POST /api/events` for agents (ending a parent
  closes open descendants); `flambe message` allows stack changes again.
  Model review when a structural rule fires and `direction` on lifecycle
  events: in progress via ADR-014.
- [ADR-012](ADR-012-reducer-places-work-and-names-agents.md): the reducer
  resolves `start` (agent-scoped parent inference, thread follows parent,
  category inheritance; local `flambe serve` too), places roots via the model
  asynchronously (thread + categories, `reducer_decision` event), and names
  agents (`agents` table, `x-flambe-agent-name`, `flambe whoami`).
  `FLAMBE_AGENT_PLATFORM` (Cloud secret `Cursor Cloud`) is the shared product
  label, stored on the agent, not a lane name.
  Not yet: re-placing an activity when its name changes. Model review of
  deterministic decisions: in progress via ADR-014.

Optional Fly secrets: `FLAMBE_REDUCER_PRIMARY_MODEL` / `FLAMBE_REDUCER_ESCALATION_MODEL`
(defaults `gpt-5.6-luna` / `gpt-5.6-terra`). Local Phoenix needs `OPENAI_API_KEY`
in `.env`. Do not commit it.

Reducer v1 explicitly stopped short of orchestration, worker spawning, and
global-intent mutation. Open question from ADR-010: do agents actually obey a
returned `direction`? The skill is the only enforcement. ADR-011's answer for
structure is to enforce invariants server-side instead; `direction` stays
advisory until the model path runs on lifecycle events.

Untracked locally (do not treat as product work): root `package-lock.json`.

## Follow-ups (other repos / later Flambe)

1. **Pulse `carbon/`** — Dagster OSS on Fly (`pulse-carbon`), not Dagster+.
   Posts daily US grid intensity as Flambe `kind=carbon`. Next: `fly apps
   create`, volume, secrets, deploy (see `pulse/carbon/README.md`), then enable
   `daily_us_carbon_schedule`.
2. **Pulse** — after a day closes, electricity kWh × that day’s intensity →
   kgCO₂; merge `kwh_actual` / `kgco2_estimated` / `kgco2_error` onto the same
   observation payload.
3. **Flambe chart** — render observations (carbon, later mood) on the timeline.
   ADR-008 explicitly left this out.
4. **Moods** — same observation primitive (`kind=mood`, omit `observed_on`).
   No CLI or UI beyond `flambe observe` exists yet.

## Parked (do not implement until asked)

- [Deferred: SPA effects without sagas](deferred-spa-async.md)
