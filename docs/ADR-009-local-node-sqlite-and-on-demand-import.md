# ADR-009: Local Node+SQLite runtime with on-demand import into Fly

## Status

Accepted

## Context

The hosted instance (ADR-007) is David’s personal Phoenix + Postgres server. The work laptop
currently points the CLI at that URL, so agent traces from company work land in the personal
database. Local Phoenix + Postgres already exists as an option, but it is a heavy second
install (Elixir, OTP, native bcrypt, PostgreSQL) for a mode whose job is “keep this machine’s
data here until I choose otherwise.”

David wants a local mode that stays on the laptop, and a way to export that data and import it
into production on demand.

## Decision

Keep production as Phoenix + Postgres on Fly.

Add a **local runtime** that is Node 22 + SQLite, with no Elixir and no Postgres. It speaks the
existing CLI HTTP contract (`FLAMBE_URL` + bearer token + `/api/activities` and `/api/events`).
Default bind is loopback. Work-laptop `.env` points at that URL.

Export is a file on disk. Import into production is an explicit step — not sync, not a
background replica. Credentials and API tokens are not part of the bundle.

Integer IDs are local to each database. Import remaps them onto the production user and **creates
a new trace** (if the name is taken, it becomes `"Name (imported)"`). The same bundle is skipped
on a later import via `traces.import_key`. Categories match by `(user, name)` when possible.

## Rationale

David does not want the work laptop writing to the personal server all the time. He wants the
option to keep everything local, and is choosing SQLite and no Elixir to make that local option
lighter than running the full Phoenix stack. He wants export → production import on demand so
selected history can still live on the hosted instance.

## Alternatives considered

- Keep using local Phoenix + Postgres as the “offline” mode. Already possible; rejected as too
  heavy for the work laptop.
- A self-contained Mac app wrapping the current stack. Not selected; agents already use npm/CLI.
- Hosted-only with more careful `.env` discipline. Not selected; too easy to keep pointing at Fly.
- Automatic sync from local SQLite to Fly. Not selected; that would recreate the leak.

## Consequences

There will be two server implementations for a while. The CLI stays the compatibility seam.
The SPA’s Phoenix Channel live updates are not provided by Node; local live UI needs a
non-Phoenix transport or polling (not decided here). Cloud agents still cannot write to
loopback.

An export file is itself sensitive. Import is the only path from work traces onto the personal
server.

## Follow-ups

- Point the work-laptop `.env` at loopback once `flambe serve` is running.
- Local live chart: the SPA already polls the open trace every 2s when the Phoenix socket is missing; serve built assets with `--static` or Vite-proxy to the local port.
- Import always creates a new production trace (name collision → `"… (imported)"`). The same bundle is skipped via `import_key`.
