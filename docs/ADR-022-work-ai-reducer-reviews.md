# ADR-022: Let the current work AI review Single Burner

## Status

Accepted — David requested this workflow on 2026-10-22 after clarifying that he
wants his existing work AI to make decisions without another model or API key.

## Context

ADR-021 added optional server-initiated inference through an API or local model.
That does not reuse the AI already helping with the work. David has ChatGPT and
Claude access and wants that AI to review the local activity stack.

## Decision

Add an explicit `agent` reducer mode. Single Burner returns a review containing
activity context, review instructions, a decision schema, and a review id. The
current work AI reasons over it and submits its decision through the local CLI
or a Single Burner-only MCP tool. No model process or inference request is
started by Flambe in this mode. Existing off/API/local modes remain available.

Single Burner remains authoritative for persisted state. It validates the same
bounded decisions as provider-backed review, checks instance, trace, agent,
expiry, and unchanged activity state, then commits changes and audit together.
Persist review receipts so retrying a completed decision cannot apply it twice.
Reviews and receipts are local runtime records, excluded from history exports.

David subsequently raised the cost of using an expensive chat model instead
of the usual cheaper reducer. The implementation defaults to explicit scope
reviews: deterministic tracking and small structural notices do not return
review context. `FLAMBE_LOCAL_REDUCER_REVIEW_STARTS=true` opts into review packets
for flagged starts. Work-AI context contains the current path and this agent's
open work; routine replies omit unrelated history and declare their scope.
Explicit status reads remain available. Reviews use the current model and its
allowance, without automatic routing to a cheaper model.

## Consequences

No extra model credential or Ollama is required. The work AI must explicitly
complete requested reviews; it is not an independent background reviewer. Its
judgments are not represented as independent approval of its own work. If the
work AI is cloud-hosted, the context returned to it reaches that provider even
though Flambe stores its database locally. The private ChatGPT bridge still
needs its existing tunnel credentials, independently of inference.

Pending reviews expire after 15 minutes. Lifecycle proposals remain recorded
while review is pending or rejected. Conflicting activity changes require a
fresh review; completed identical submissions return their receipt. Reviews
survive server restarts. Reparenting is limited to the reviewed running activity
and eligible running parents belonging to the same agent.
