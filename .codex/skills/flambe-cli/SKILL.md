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

Every command is a proposal; the reducer owns the stack. Without `--parent`/`--root`, `start` nests under **your own** newest active activity (other agents' work is never your parent), puts a child on its parent's thread, and gives it the parent's categories; a new root gets its thread and categories chosen by the reducer a few seconds later. `FLAMBE_THREAD` (name, unique slug, or id) is sent as `--thread` when that flag is omitted; do not list threads and pick one by project name. Pass `--thread` / `--parent` / `--category` only when you are certain. Offline `offline-…` ids from `start` are valid for `end`. Do not retry queued operations. Offline or local-`serve` results carry no reducer output; nothing is dropped.

## Read every result; the reducer may rewrite

Any command (`start`, `end`, `suspend`, `resume`, `message`) may come back with `direction`, `reply`, and `actions_applied`, not only `message`. The reducer records what you proposed and then corrects the structure around it when needed: re-parent, rename, treat your `start` as a resume of an already-open same-name activity, resume a suspended ancestor before nesting under it, or close open descendants when you end a parent (`--force`). The CLI prints each rewrite on stderr (`reducer nested 43 under 42`, `actions`). The returned state is the truth: keep using the ids it gives you, do not undo a rewrite, and do not re-issue the proposal.

The reducer may answer a proposal with a question in `reply`, usually when a name does not fit its ancestors. Answer before your next step: rename the activity, or reply with `flambe message`. The CLI reminds you on the next command if a question is still open; it never refuses.

A returned `direction` is binding: act on it before doing more work. On `pause`, `stop`, or `escalate`, stop and surface the reply to David rather than deciding yourself. `direction -` or none means continue as you were. A model-judged `start` can take a few seconds; wait for it.

## Ask the reducer before you drift

`flambe message "<update>"` is your own channel: it sends your update plus the live flame (open and suspended work, the path to the current activity, and ended work from the last 21 days) and answers with `assessment`, `direction`, `reply`, and at most one stack change. Message when you are about to:

- widen scope beyond the activity you started
- change approach after the plan stalled
- end a root workstream
- continue while suspecting the work has drifted from what David asked
- answer a question the reducer asked

Do not message for routine progress, and never instead of `start`/`end`. Defaults to your newest active activity; pass `--activity <id>` to target another. Needs a reachable server (not queued).

## What to record

- Start a new activity when the goal or scope meaningfully changes (a specific implementation, a discovered prerequisite, a concrete bug, focused tests, verification) — that is a stack push.
- Do not start an activity for committing or pushing. Those are wrap-up of the current leaf; mention them in the end-message if useful. Exception: the assigned work *is* getting code onto a remote.
- Name the concrete action and object (`Fix USERPROFILE config resolution`), not `Investigate` / `Implement` / `Work on tests`. Stay well under 255 characters; do not compensate with a long name or `--description`.
- End-message: the outcome, not `done`. That records a resolution. Omitting the message is a plain end. No secrets, tokens, or transcripts. Ending the leaf is the pop; then resume the parent mentally and in the log.
