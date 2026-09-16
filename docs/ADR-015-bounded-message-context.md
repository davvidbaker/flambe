# ADR-015: Bound `flambe message` context to the live stack plus recent closed work

## Status

Accepted.

## Context

`flambe message` JSON-encodes the current trace into the Reducer Agent prompt. That
payload grew with every activity ever created on the trace, including long-finished
subtrees, and repeated the current node, ancestors, children, and siblings on top of
the full `stack`. Events were never included; other traces were never included. The
cost concern was this message path specifically.

A calendar-only window (for example “activities from the last 3 weeks”) can drop a
still-open root whose only event is an old `B`. That node is the global intent the
reducer is supposed to protect.

David accepted a hybrid bound after that tradeoff was laid out.

## Decision

1. **Live stack is always in the prompt.** The path from root to the activity being
   messaged, plus every non-ended activity in the trace (latest lifecycle phase `B`,
   `R`, `X`, or `S`).
2. **Ended work is capped at 21 days.** An ended activity (`E`, `J`, `V`) is included
   only when its last lifecycle event is within 21 days. Older closed subtrees are
   omitted unless they lie on the current path.
3. **The prompt is not a duplicate neighborhood.** Context is `trace`, `current`,
   `ancestors`, and the filtered `stack`. Empty descriptions and missing agent fields
   are omitted.
4. **Mutations may only target visible ids.** `create_child` / `update_activity`
   validation already uses `context.stack`; omitted activities cannot be edited.

Placement (root `start`) and structure review on `start` are unchanged.

## Rationale

David wanted the message path bounded as the trace grows. A live-stack-only bound
keeps intent; a 3-week window on closed work keeps recent history without replaying
the whole forest. The 21-day figure is the window David agreed to, not a measured
optimum.

## Alternatives considered

- **Unchanged: every activity in the trace.** Rejected: unbounded token growth on
  `message`.
- **Calendar window as the only bound (≈3 weeks).** Rejected: drops long-running open
  roots that have gone quiet while children work.
- **Hard cap of N most recent activities.** Not chosen: can hide a parallel open root.
- **A second model call that summarizes the archive.** Not chosen: spends tokens to
  save tokens.

## Consequences

- A worker `message` no longer shows the reducer finished work from outside the
  21-day window (unless it is on the current path). Drift against a long-closed
  sibling is harder to see.
- Token use on `message` tracks how much is still open, plus a bounded amount of
  recent closed work, not how long the flame has existed.
- ADR-014’s description of the reducer receiving the “full stack” on `message` is
  superseded for this payload.

## Follow-ups

- Revisit 21 days if traces stay bushy while open, or if missing closed context
  becomes a real miss.
