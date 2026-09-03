---
name: flambe-cli
description: Track coding-agent work in a Flambe trace with the flambe CLI. Use when logging substantial or multi-step work in a project configured with FLAMBE_URL, FLAMBE_API_TOKEN, and FLAMBE_TRACE_ID.
---

# Flambe CLI

Log semantic work units as a live flame chart — not commands, file opens, or hidden reasoning. Skip trivial questions. If `.env` is missing `FLAMBE_URL`, `FLAMBE_API_TOKEN`, or `FLAMBE_TRACE_ID`, skip silently.

Needs Node 22+. Before the first command, if `FLAMBE_AGENT_NAME` is unset, export a short product/model name (`export FLAMBE_AGENT_NAME="Grok"`). Do not put `FLAMBE_AGENT_ID` or `FLAMBE_AGENT_NAME` in `.env`.

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
```

**255-character hard limit on activity names and `--description`.** The column is `varchar(255)`. A longer value returns a 500 and can wedge the offline queue. Count before `start`. Prefer a short concrete name; put detail in the end/suspend/resume message (those are unbounded).

Reuse this conversation's activity id when you already have one. Run `flambe status --active --json` only to find a matching open activity from this session; ignore unrelated active work. Do not fetch suspended/threads/categories unless the default thread or parent is wrong.

`start` uses the default thread and the newest active parent. Pass `--thread ID` / `--parent ID` / `--category ID` only when you already know them. Offline `offline-…` ids from `start` are valid for `end`. Do not retry queued operations.

## What to record

- Start a new activity when the goal or scope meaningfully changes (a specific implementation, a discovered prerequisite, a concrete bug, focused tests, verification) — that is a stack push.
- Name the concrete action and object (`Fix USERPROFILE config resolution`), not `Investigate` / `Implement` / `Work on tests`. Stay well under 255 characters; do not compensate with a long name or `--description`.
- End-message: the outcome, not `done`. No secrets, tokens, or transcripts. Ending the leaf is the pop; then resume the parent mentally and in the log.
