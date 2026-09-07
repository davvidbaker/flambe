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

`start` is a proposal. Without `--parent`/`--root`, the reducer nests the new activity under **your own** newest active activity (other agents' work is never your parent), puts a child on its parent's thread, and gives it the parent's categories; a new root gets its thread and categories chosen by the reducer a few seconds later. The CLI prints what was inferred on stderr (`reducer nested 43 under 42`). `FLAMBE_THREAD` is sent as `--thread` when that flag is omitted. Pass `--thread ID` / `--parent ID` / `--category ID` only when you are certain. Offline `offline-…` ids from `start` are valid for `end`. Do not retry queued operations.

## Ask the reducer before you drift

You propose stack transitions; the reducer owns the stack and global intent. `start`/`end` are proposals it records deterministically. If you end a parent with `--force` while descendants are open, the reducer ends them too and the CLI reports it on stderr. `flambe message "<update>"` sends your update plus the whole flame to the reducer, which answers with `assessment`, `direction`, and `reply`, and may make one change to the stack (a child under your activity, or a rename), listed in `actions_applied` and printed as `actions`. Treat that change as the new truth; do not undo it.

Message the reducer when you are about to:

- widen scope beyond the activity you started
- change approach after the plan stalled
- end a root workstream
- continue while suspecting the work has drifted from what David asked

Do not message for routine progress, and never instead of `start`/`end`. Defaults to your newest active activity; pass `--activity <id>` to target another. Needs a reachable server (not queued).

A returned `direction` is binding: follow it before doing more work. On `pause`, `stop`, or `escalate`, stop and surface the reply to David rather than deciding yourself. `direction -` means continue as you were.

## What to record

- Start a new activity when the goal or scope meaningfully changes (a specific implementation, a discovered prerequisite, a concrete bug, focused tests, verification) — that is a stack push.
- Name the concrete action and object (`Fix USERPROFILE config resolution`), not `Investigate` / `Implement` / `Work on tests`. Stay well under 255 characters; do not compensate with a long name or `--description`.
- End-message: the outcome, not `done`. No secrets, tokens, or transcripts. Ending the leaf is the pop; then resume the parent mentally and in the log.
