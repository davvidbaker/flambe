---
name: flambe-cli
description: Track coding-agent work in a Flambe trace with the flambe CLI. Use when logging substantial or multi-step work in a project configured with FLAMBE_URL, FLAMBE_API_TOKEN, and FLAMBE_TRACE_ID.
---

# Flambe CLI

Log semantic work units as a live flame chart — not commands, file opens, or hidden reasoning. Skip trivial questions. If `FLAMBE_URL`, `FLAMBE_API_TOKEN`, or `FLAMBE_TRACE_ID` is set neither in `.env` nor in the shell environment (Cloud Agent secrets arrive as environment variables), skip silently.

Needs Node 22+ and `flambe` on `PATH`. If it is missing, `npm install -g @davvidbaker/flambe-cli`; in this repo without a global install, use `node cli/bin/flambe.mjs`. You do not need to pick a name: the reducer names each agent on its first request, the CLI remembers it (`~/.flambe/agent-names.json`) and prints `reducer named this agent "X"` on stderr once. `flambe whoami` shows your id, name, and platform. `FLAMBE_AGENT_PLATFORM` is the product you run on (`"Cursor Cloud"`, `"Codex"`; derived from the session when unset) and is shared by many agents; it is not your name. Set `FLAMBE_AGENT_NAME` only to override; never put `FLAMBE_AGENT_ID`, `FLAMBE_AGENT_NAME`, or `FLAMBE_AGENT_PLATFORM` in `.env`.

## Think in a stack

Always treat attention as a **call stack**, not a flat to-do list.

You will often produce some progress on a parent goal, then go down a rabbit hole about one specific thing (a bug, a prerequisite, a design question, a test failure). That digression is a **push**: start a nested activity under the still-running parent. When the rabbit hole is done, **pop**: end the nested activity with the outcome, and continue the parent where you left off.

- Leave parents running while you dig. Ending the parent when you dive deeper flattens the chart and loses the “come back up” story.
- Nested steps belong under the workstream they serve — not as siblings of the top objective.
- When attention moves to a true sibling of the current leaf, end the leaf first, then start the sibling under the same parent.
- Use `--root` only for a genuinely new top-level workstream, not for every digression.
- Keep the active stack truthful as work changes. Do not plan a detailed chart up front or reconstruct one afterward.

## Local Codex hooks

For a Single Burner project, run `flambe setup codex` from its root after setting
its local connection values in `.env`. Setup merges project hooks into
`.codex/hooks.json` and installs this skill if it is missing. Existing custom
skills and unrelated hooks are retained. Restart local Codex and review/trust
these hooks with `/hooks`; installed files alone do not prove they are running.
Use `flambe setup codex --check` to inspect the files, and `--remove` to remove
only Flambe's own hook handlers. Keep `flambe` on PATH; Windows hooks use
`flambe.cmd` so PowerShell script policy does not select `flambe.ps1`.

Hooks restore workflow context, request periodic stack checks, and can request
one reconciliation continuation before a substantive turn ends. They make no
inference calls or semantic activity changes. You still start/nest/end the real
work and complete requested work-AI reviews. A turn ending does not mean its
parent task ended. Missing servers or identity produce feedback without blocking
ordinary work. Hooks require `local_self_contained`; they do not route to Cloud.

## Commands

```sh
flambe start "Fix USERPROFILE resolution"     # prints id; nests under the current active activity
flambe start "Add Windows support" --root     # new top-level workstream
flambe end "$ID" "Resolved USERPROFILE on Windows"
flambe suspend "$ID" "Waiting for product decision"   # only when explicitly tabling work
flambe resume "$ID" "Decision received"
flambe observe carbon 312.4 --unit gCO2eq/kWh --on 2026-09-04 --payload '{"source":"us-ba-mean"}'
flambe message "Auth fix needs the session module refactored too; widening scope"   # ask the Reducer Agent
```

`observe` writes a user overlay (carbon, mood, …), not an activity. Same `kind` + `--on` date upserts and merges payload keys. Omit `--on` to always insert.

**255-character hard limit on activity names and `--description`.** The column is `varchar(255)`. A longer value returns a 500 and can wedge the offline queue. Count before `start`. Prefer a short concrete name; put detail in the end/suspend/resume message (those are unbounded).

Reuse this conversation's activity id when you already have one. Run `flambe status --active --json` only to find a matching open activity from this session; ignore unrelated active work. Do not fetch threads or categories to decide placement; that is the reducer's job.

Every command is a proposal; the reducer owns the stack. Without `--parent`/`--root`, `start` nests under **your own** newest active activity (other agents' work is never your parent), puts a child on its parent's thread, and gives it the parent's categories; a new root gets its thread and categories chosen by the reducer a few seconds later. `FLAMBE_THREAD` (name, unique slug, or id) is sent as `--thread` when that flag is omitted; do not list threads and pick one by project name. Pass `--thread` / `--parent` / `--category` only when you are certain. Offline `offline-…` ids from `start` are valid for `end`. Do not retry queued operations. Offline results carry no immediate reducer output; nothing is dropped. Local `serve` always applies deterministic rules, including duplicate reuse, ancestor resumption, and descendant closure. Optional review is off by default; an explicitly configured server can ask the current work AI to review or call a separate model.

## Read every result; the reducer may rewrite

Any command (`start`, `end`, `suspend`, `resume`, `message`) may come back with `direction`, `reply`, and `actions_applied`, not only `message`. The reducer records what you proposed and then corrects the structure around it when needed: re-parent, rename, treat your `start` as a resume of an already-open same-name activity, resume a suspended ancestor before nesting under it, or close open descendants when you end a parent (`--force`). The CLI prints each rewrite on stderr (`reducer nested 43 under 42`, `actions`). The returned state is the truth: keep using the ids it gives you, do not undo a rewrite, and do not re-issue the proposal.

The reducer may answer a proposal with a question in `reply`, usually when a name does not fit its ancestors. Answer before your next step: rename the activity, or reply with `flambe message`. The CLI reminds you on the next command if a question is still open; it never refuses.

A returned `direction` is binding: act on it before doing more work. On `pause`, `stop`, or `escalate`, stop and surface the reply to David rather than deciding yourself. `direction -` or none means continue as you were. A model-judged `start` can take a few seconds; wait for it.

David can message you from the Flambe UI. Any command may print `message from the user (binding; act on it before your next step): …` on stderr (`inbox` in JSON). It is a direct instruction from David, delivered once: follow it before your next step and keep working, adjusted. If it says to stop or wait, stop and surface it. Acknowledge it in chat; reshape the stack with `start`/`end` if it changes what you are doing.

## Review with the AI doing the work

Review only at meaningful scope/approach decisions or when placement is uncertain.
Routine lifecycle tracking uses deterministic local rules. Do not review every
start/end, and do not request full history for routine bookkeeping. Work-AI
review context contains the current path and this agent's open work. Compact
lifecycle replies mark their state scope; omitted activities are not ended.

When a local result contains `review` and `model_review.status: awaiting_decision`,
you are the reviewer. This is the current work AI evaluating its own context,
not independent approval. Do not start another model, ask for provider keys, or
claim a separate reviewer approved your work.

Read `review.instructions`, `review.context`, and `review.decision_schema`.
Evaluate the user's intent, current path, and proposed scope. Choose concise
assessment, direction, reply, rationale, and at most one permitted action.
Write that decision as JSON and submit it with:

```sh
flambe decide <review.review_id> --file <decision.json>
```

`flambe message` returns the review JSON in this mode. Flagged starts normally
print only a small review-available notice on stderr; request review only when
scope or placement needs judgment. They include full review JSON only when the
server explicitly enables automatic start reviews. Stdout remains the recorded id. Keep the same local
connection, trace, and stable agent id for both steps. Ordinary
lifecycle tracking continues to use start/end/suspend/resume.

Complete a requested review before continuing substantive work. Follow the
returned direction after submission; escalate unresolved human judgment with no
actions and ask the user. Do not repeat the recorded start to request review.
On `REDUCER_STATE_CHANGED` or `REVIEW_EXPIRED`, request a fresh review with
`flambe message` for that activity, reassess it, and submit against the new id.
Do not resubmit the old decision blindly. Identical retries of a completed
submission return a receipt; `replayed: true` means no new action was applied.
If the server lacks work-AI review support, report that instead of changing instances.

## End of work

When the work you were doing is finished, check limbo and scheduled activities before you stop. Run `flambe status --unstarted --json`. If something there is worth doing next, propose that candidate with `flambe message` and begin it only if the reply says continue. Do not begin it unasked, and do not ask David in chat.

## Ask the reducer before you drift

`flambe message "<update>"` is your own channel: it sends your update plus the live flame (open and suspended work, the path to the current activity, and ended work from the last 21 days) and answers with `assessment`, `direction`, `reply`, and at most one stack change. Message when you are about to:

- widen scope beyond the activity you started
- change approach after the plan stalled
- end a root workstream
- continue while suspecting the work has drifted from what David asked
- answer a question the reducer asked

Do not message for routine progress, and never instead of `start`/`end`. Defaults to your newest active activity; pass `--activity <id>` to target another. Needs a reachable server with model review configured (not queued). Local self-contained `serve` has optional review, off by default, including an `agent` mode that returns review context for you to evaluate. On `REDUCER_NOT_CONFIGURED`, do not retry or switch to a remote server; surface unresolved judgment to the user and continue deterministic logging. A lifecycle result with `model_review.status: failed` still recorded the activity: keep its returned id/state, surface the review failure, and do not repeat the start or retarget another instance.

## What to record

- Start a new activity when the goal or scope meaningfully changes (a specific implementation, a discovered prerequisite, a concrete bug, focused tests, verification) — that is a stack push.
- Do not start an activity for committing or pushing. Those are wrap-up of the current leaf; mention them in the end-message if useful. Exception: the assigned work *is* getting code onto a remote.
- Name the concrete action and object (`Fix USERPROFILE config resolution`), not `Investigate` / `Implement` / `Work on tests`. Stay well under 255 characters; do not compensate with a long name or `--description`.
- End-message: the outcome, not `done`. That records a resolution. Omitting the message is a plain end. No secrets, tokens, or transcripts. Ending the leaf is the pop; then resume the parent mentally and in the log.
