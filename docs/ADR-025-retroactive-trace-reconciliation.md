# ADR-025: Retroactive trace reconciliation

## Status

Accepted as the feature contract in issue #158.

## Context

An agent can miss lifecycle events for part or all of its session, including
work delegated to subagents. The session records available to the agent and
the trace stored by Flambé can therefore describe different histories.

## Decision

An explicit request starts an audit of the current agent session and its
accessible subagents. The agent works backward to a verified interval of
healthy tracking or to session start. It submits one reconciliation proposal
to the trace's selected instance. The proposal includes a baseline trace
version, a repair identifier, proposed historical lifecycle changes, and any
coverage gaps. Each change carries its evidence basis, agent/session reference
when available, and observed or estimated timing. Detailed source records stay
with the harness.

The Reducer evaluates the whole proposal. Where it is unavailable, the same
deterministic rules apply on both runtimes and defer ambiguous or conflicting
changes. A repair applies validated changes and restores the active stack in
one storage transaction. The transaction checks the expected trace version,
records the before and after state and provenance with a server-assigned
recorded-at time, and saves a receipt for idempotent replay. A stale proposal
requires a fresh snapshot and reassessment before retrying.

## Rationale

A batch gives the Reducer enough context to assess relationships between
activities. Restoring the stack in the same transaction keeps the visible
history and live work consistent. A repair receipt preserves the original
history and distinguishes historical evidence from the time Flambé committed
the correction.

## Follow-ups

Cloud and Single Burner accept the same proposal over HTTP and MCP.
Claude subagent logs can be discovered alongside the parent log. Codex and
Pi require separately supplied subagent files. Ownership for a delegated
correction requires a session reference and a link to the caller's trace tree.
The Single Burner work-AI Reducer mode uses deterministic fallback for repair.
