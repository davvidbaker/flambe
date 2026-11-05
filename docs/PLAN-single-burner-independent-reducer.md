# Cloud-like independent reducer for Single Burner

Status: **Codex transport implementation requested; broader Cloud-parity changes remain a proposal**.
Originally investigated for David on 2026-11-05. The initial investigation changed no runtime behavior.

The subsequent implementation adds `codex` to the existing independent-provider
pipeline, preserving API/local and their validation policy. It uses the pinned
official npm CLI directly (the SDK does not expose the required exec isolation
flags), a dedicated login, explicit model/low effort, ephemeral execution, and
an inert custom model catalog so backend model metadata cannot restore agent
tools. No credentials are copied, no stronger-model escalation is added, and no
real inference/billing claim is made. See the [setup and isolation contract](../single-burner/README.md#independent-codex-reducer).
The semantic conflict guard, richer context/category policy, authority alignment,
and escalation proposals below are **not** implemented by that transport change.

## Goal

The server, not the working AI, obtains independent reducer judgments and applies
validated corrections and guidance. Codex is an inference transport, not another
writer of Flambe state. Preserve existing off/agent/API/local choices.

“Cloud-like” means the actual Cloud review contract, not a continuously running
agent that can autonomously rewrite history or change the user's intent.

## What exists today

| Behavior | Cloud | Single Burner |
| --- | --- | --- |
| Lifecycle rules | Deterministic parent inference, inheritance, duplicate reuse, ancestor resumption, descendant closure | Already implemented |
| Structural judgment | Server-triggered on new root while own work is open, or lexically mismatched child name | API/local already invoke a separate model; agent mode usually offers self-review on request |
| Worker messages | Independent assessment/direction/reply; at most one permitted mutation | API/local already do this; agent mode returns a review packet |
| Root placement | Separate asynchronous thread **and category** classification | Initial unspecified running root can get a thread-selection review; no AI category-selection action or category catalog in review context |
| Context | Stateless snapshots: current path, open/unstarted work, recent closed work (21 days) | Provider reviews include current path, open and recent closed lifecycle work; unstarted work is absent. Work-AI reviews are narrower |
| Routing | Typed Jev first pass when configured; generative fallback; message review has primary/escalation models | One configured provider/model; no equivalent routing/escalation chain |
| Authority | Structural keep/rename/ask/reparent; message no-op/clarify/create child; no model-driven end/delete | Much of this already exists; exact permissions depend on review kind. Explicit message reparent/ask currently require agent reviewer mode |
| Continuity | Review stage explicitly stateless; no persistent reducer conversation | Also snapshot-based; CLI remembers questions, but snapshots do not include a curated history of prior directions |

Relevant sources:
- `backend/lib/flambe_next/reducer.ex`: deterministic fold and structural triggers.
- `backend/lib/flambe_next/reducer/{placement,review,model,jev}.ex`: placement,
  context, permissions, classification, fallback, and message escalation.
- `cli/src/local/{commands,reducer,reducer-review,work-ai-review}.mjs`: local fold,
  review policy, model boundary, validation, and review receipts.
- [ADR-021](ADR-021-optional-single-burner-ai-reducer.md),
  [ADR-022](ADR-022-work-ai-reducer-reviews.md).

Neither implementation sees the worker's entire conversation. Root intent comes
from recorded names/descriptions and updates; independent inference cannot
recover user intent that was never supplied. Do not add repo/chat scraping to
compensate. Do not copy weaker Cloud mutation/concurrency details merely for parity.

## Confirmed concurrency defect

`fingerprint(trace)` hashes the complete serialized trace, including annotation
events outside the activity being reviewed. In a disposable SQLite instance:

1. Agent A starts a root and receives a review.
2. Agent B starts unrelated work.
3. A submits an otherwise valid no-op: `REDUCER_STATE_CHANGED`.
4. A requests a fresh review; an audit-only `reducer_decision` event is written
   on B; A's valid no-op is rejected again.

Both cases were reproduced without a provider call. This explains a mechanism
behind the work-machine errors, not the content of its invalid decisions.

Do not simply disable staleness checks or ignore every other agent. Cross-agent
work can be relevant to a global judgment. Proposed replacement:

- Snapshot semantic context and explicit mutation dependencies, not every raw event.
- Structural/placement reviews depend on the target, path, eligible parents,
  relevant thread/category catalogs, and relevant lifecycle state.
- Broader message reviews must also notice meaningful changes to the global work
  actually shown to the model. Annotation-only writes should not invalidate them.
- Inside the apply transaction, recheck ownership, phase, parent eligibility,
  cycles, current user placement, and other action-specific preconditions.
- On a meaningful conflict, obtain fresh context and re-review **once**, within
  the original total deadline; never replay the worker's lifecycle proposal.
- If still conflicting, preserve work and return an explicit unresolved review.

## Proposed first implementation

1. **Keep one authoritative reducer pipeline.** Ordinary lifecycle rules remain
   model-free. Independently review flagged structural starts and explicit worker
   messages. Root placement gets a separate validated thread/category decision.
   No polling brain or model call for every end/status/resume is needed for Cloud parity.
2. **Add optional `codex` provider mode.** Fresh Codex conversation per judgment;
   compact bounded context, explicit model, low reasoning effort, structured
   output, cancellation, and captured token usage. No worker `decide` round-trip
   in this mode. An “uncertain” judgment can escalate to a separately configured
   stronger model; without one, request human judgment rather than invent certainty.
3. **Preserve bounded authority.** At most one structural/message action; no
   delete, model-invented completion, or change of root intent. Placement may
   choose existing thread/categories atomically. Preserve authoritative explicit
   choices and inherited lanes. Advice-only remains enforced locally.
4. **Use the existing response contract.** Assessment, direction, reply,
   actions_applied, rules_fired, and reviewer metadata go back to the worker.
   Keep synchronous steering for structural/message review. Asynchronous placement
   is useful, but needs an explicit pending/job outcome and visible completion;
   do not introduce a silent fire-and-forget daemon in the first provider patch.
5. **Observe the independent review.** Log review id/target, provider/model,
   timing, usage, attempts, conflict/failure code, and applied action metadata.
   The readable viewer should explain retries and escalation. No credentials,
   raw model reasoning, or provider errors in the diagnostic log.

## Codex SDK evidence and prerequisite

Inspected the published `@openai/codex-sdk@0.166.0` README, declarations, and
execution wrapper, plus the matching `rust-v0.166.0` configuration schema:
- https://www.npmjs.com/package/@openai/codex-sdk
- https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/config.schema.json

The SDK wraps `codex exec`, supports `outputSchema`, `AbortSignal`, explicit
model/reasoning, environment control, read-only sandboxing, approval policy,
web-search controls, and token usage. It depends on the Codex CLI package.
A temporary fake-executable spike exercised the actual SDK: schema/config
forwarding, structured response and usage extraction, an allowlisted environment,
and abort cancellation passed without invoking a model. This verifies transport,
not actual tool isolation, login, model quality, or production latency. The SDK
passes the schema to the CLI; Flambe must still validate the returned decision.

It is **not** a bare tool-free inference client. Defaults inherit the server's
environment and Codex configuration; sessions are persisted in the Codex home.
Read-only sandboxing alone does not prevent reading private files.

Before integration, prove an isolated profile and empty working directory can
exclude project/global instructions, skills, hooks, MCP, shell, other tools,
worker session ids, and Flambe credentials. Do not rely only on a prompt saying
“don't use tools,” or detect a tool call only after it has executed. Verify
aborts terminate inference and no recursive tracking is possible. Isolate retained
Codex transcripts as well; disabling command history is not proof of no sessions.
Use a pinned SDK/CLI version and negative tests for configuration inheritance.

Prefer a dedicated reducer `CODEX_HOME` with an explicit one-time login using
the desired account, rather than silently copying work-session credentials or
sharing all its configuration. Existing Codex login reuse is a separate option
only if its configuration boundary can be proven. Account/model availability,
subscription limits or API billing, latency, and actual cost remain unverified.
No live inference was performed; no Codex CLI is installed on this machine.

## Delivery and acceptance

- First: isolated SDK feasibility spike, using a fake executable for deterministic
  transport tests and an explicitly authorized/account-configured real smoke test.
- Then: semantic concurrency guard plus conflict tests (audit-only, independent
  branch, relevant rename/lifecycle change, human move, duplicate request, cycle).
- Then: independent structural/message review and separate root/category placement;
  configurable escalation and bounded total retry/cost policy.
- Test the full CLI/REST/MCP path: misnested start corrected; drifting message gets
  guidance; clarification and necessary unstarted child work; explicit choice is
  respected; conflicting human edit wins; provider outage never drops work.
- Measure real judgment quality, latency, and usage on representative flame
  scenarios before claiming a fast/low-cost Cloud replacement.

Open human decisions: dedicated reducer login versus existing-login reuse;
primary model/account and whether paid/stronger-model escalation is allowed.
This is not a request to disable `agent` mode globally or a publish-ready release.
