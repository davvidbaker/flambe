# ADR-021: Optional Single Burner AI reducer

## Status

Accepted — optional modes authorized by David on 2026-10-22.

## Context

Single Burner's deterministic reducer works locally, but its `message` command
always returned `REDUCER_NOT_CONFIGURED`, and structural judgments were skipped.
David asked to add AI review without requiring Flambe Cloud.

## Decision

Add three explicitly configured modes: **off** (default), **api**, and **local**.
API mode uses an explicitly configured OpenAI Responses-compatible endpoint and
dedicated credential. Local mode uses an Ollama-compatible loopback endpoint
and an explicitly selected installed model. These are implementation choices
for the two provider options David approved; neither mode uses Flambe Cloud.
Existing Cloud or tunnel credentials do not enable review implicitly.

REST, legacy agent adapters, and MCP use one local command runner. It delegates
ordinary lifecycle rules to the existing synchronous command engine, then
requests model judgment for `message` and flagged structural starts. The prompt
contains the current activity, its path, open work, and ended work from the past
21 days, bounded to 64 KiB. It excludes credentials and raw database files.

Treat model output as an untrusted proposal: validate its shape, bounded text,
allowed actions, trace membership, parent candidates, and absence of cycles.
Message review can clarify work or create an unstarted child; structural review
can clarify, ask about, or reparent the new activity. Models cannot delete or end
work. Advice-only requests suppress mutations locally. Apply at most one action.

Wait for the model outside any SQLite transaction. Before applying a judgment,
check that the trace still matches the reviewed snapshot; reject stale advice
instead of overwriting concurrent human or agent edits. Commit model changes and
audit events together. Lifecycle proposals commit before optional model review;
provider failures are returned visibly while the recorded work is preserved.

## Rationale and consequences

The configured provider determines the data boundary: API mode sends relevant
activity context to that provider; local mode only contacts loopback. A local
runtime must itself use local inference; a loopback URL cannot certify its
internal behavior. Local mode rejects known cloud-model tags and never falls
back to another endpoint. Redirects are disabled in both modes.

Provider credentials stay in the server environment. This adds no credential
store, automatic model download, or model installation. Invalid configuration
fails at startup; runtime outages do not stop ordinary tracking. Review has a
bounded timeout and response size, and raw provider error bodies are not exposed.

This first local implementation uses one configured model. It does not copy
Cloud's Jev routing or primary/escalation model chain, and it does not certify
the judgment quality of an arbitrary installed model. Real-provider evaluation
is separate from transport, validation, and failure-handling tests.

[ADR-022](ADR-022-work-ai-reducer-reviews.md) subsequently adds an `agent` mode
for the current work AI to review without a separate inference provider.
