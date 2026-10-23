# ADR-023: Use portable local Codex hooks for tracking checkpoints

## Status

Accepted — David requested portable hooks for his local Codex / Single Burner
setup on 2026-10-23 after questioning whether instructions alone cause frequent
enough activity updates.

## Context

The personal Mac already has manually configured hooks that ping Flambe and
inject workflow reminders. They contain Mac-specific executable and checkout
paths. Installing the published Single Burner and CLI on Windows does not
install those hooks. The intended client is local Codex, so this integration
does not require a ChatGPT remote plugin or Secure MCP Tunnel.

## Decision

Provide project-scoped Codex hook setup through the CLI. Preserve unrelated
hook configuration and existing workflow instructions. Package the canonical
CLI skill so setup does not depend on downloading instructions from GitHub.

Use local command hooks to restore context, prompt periodic activity-stack
checks, and request at most one reconciliation continuation before handing
back a substantive turn. The adapter does not name, start, end, or review
activities automatically. The current work AI retains those semantic decisions.

The hook adapter requires the explicit local-only runtime mode and a numeric
loopback endpoint. Shell configuration keeps precedence over project `.env`;
an incompatible endpoint is reported rather than replaced or sent to Cloud.
SQLite remains authoritative. A small local cache only throttles requests and
reminders; it is not an activity log. Hooks do not read transcripts or retain
prompts, commands, model output, credentials, or activity names in that cache.

An unavailable server produces bounded feedback and does not block ordinary
work. Hook checks make no model inference requests. A turn boundary does not
mean its activity is complete, so the agent decides whether to end, suspend,
or retain open work.

## Alternatives considered

- Instructions alone: this was the existing local setup; David requested hooks
  to make the workflow more reliable across sessions and during work.
- Copy the Mac hooks: their absolute paths do not provide a portable Windows
  installation and they lack the requested hand-back checkpoint.

## Consequences

Each project has an explicit installation and connection. Codex must reload the
configuration and the user must review/trust non-managed hooks. Enterprise
policy can restrict hooks. Hooks are workflow guardrails, not a complete
enforcement boundary: unsupported tool paths, errors, and timeouts can bypass
checks. Windows CI can verify the adapter and installation; the actual work
laptop still needs a live Codex hook/trust and tracking check.
