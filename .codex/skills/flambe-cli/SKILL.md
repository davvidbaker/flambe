---
name: flambe-cli
description: Track coding-agent work in a Flambe trace with the flambe CLI. Use when beginning, resuming, completing, or checking the status of work configured with FLAMBE_URL, FLAMBE_API_TOKEN, and FLAMBE_TRACE_ID.
---

# Flambe CLI

Record semantic work units, not individual shell commands or hidden reasoning.

## Resume or start work

Activities may stack: more than one activity can be active at once. Starting
a newly discovered prerequisite does **not** require suspending the activity
that surfaced it.

The CLI requires Node.js 22 or newer. If the current shell uses an older
runtime, switch to a compatible project runtime before invoking it (for
example, `nvm exec 22 flambe …`).

1. Run `flambe status --active --json` and `flambe status --suspended --json`
   before beginning work.
2. Inspect both `activities` arrays. An active entry has a latest begin or
   resume event; a suspended entry has a latest suspend event. Look for a
   suspended activity whose scope clearly matches the requested work and resume
   it instead of starting duplicate work. Each entry includes the activity `id`, `name`, `threadId`,
   `threadName`, `categoryIds`, and latest event details.
3. Use `flambe threads --json` to inspect the available threads. `start`
   defaults to the row marked `default`; pass `--thread ID` whenever the work
   belongs on another thread. Use `flambe categories --json` to discover
   category IDs, when categories help organize the work.
4. Choose the action that describes the work's actual state:
   - Continue an active matching activity when its scope clearly matches the
     requested work.
   - Resume a suspended matching activity only when the agent is returning to
     work that was explicitly tabled.
   - Start a new activity when newly discovered work must be completed before
     the current activity can continue. Leave the current activity active so
     the work stacks up; do not suspend it merely because attention has moved
     to its prerequisite.
   - Suspend an activity only to explicitly table it: the agent is setting that
     work aside rather than continuing it or its prerequisites now. Include the
     reason. Do not suspend merely because its next step depends on other work,
     user input, or an external dependency.

   For new work, create an activity:

```sh
flambe start "Implement activity status" --thread 14 --category 3
```

When the real start time is known and meaningful, create the activity with
`--started-at "YYYY-MM-DDTHH:MM:SS±HH:MM"`. It is optional and defaults to the
current time; do not guess a historical timestamp.

Save the numeric activity ID printed by `start`.

The `start` command prints only its numeric activity ID so it can safely be
captured by scripts. `end` only needs that ID: the activity already belongs to
its original thread.

For example, if implementation uncovers a missing migration that must be added
before implementation can continue, the agent starts an `Add migration …`
activity and leaves the implementation activity active.

Table work with `flambe suspend ID "reason"`, then use `flambe resume ID
"reason"` when returning to it. Both commands print the event ID and support
the same offline recovery as `start` and `end`.

## Complete work

When the work is complete, close the matching activity with a concise result:

```sh
flambe end "$ACTIVITY_ID" "Added status output and tests"
```

Do not record tokens, passwords, private data, or long transcripts in activity
names or completion messages.

## Configuration and recovery

The CLI loads `.env` from the current working directory. It requires
`FLAMBE_URL`, `FLAMBE_API_TOKEN`, and `FLAMBE_TRACE_ID`; never put the token in
agent instructions or version-controlled files.

When Flambe is temporarily unreachable, `flambe start` and `flambe end` save
their operations locally and print an `offline-…` activity ID (or `queued` for
an end event) instead of losing the work. Use that offline ID with `flambe end`
as usual. On the next successful CLI command, Flambe replays its compatible
queued operations in order before handling the new command, then deletes the
local backlog and any resolved offline-ID mapping. The default queue is
`~/.flambe/event-queue.json`; set `FLAMBE_QUEUE_PATH` to override it. The queue
contains operation data only, never the API token.

If an operation is still queued, do not retry it manually: invoke any Flambe
command once connectivity returns and let the CLI flush it. Run `flambe ping`
to confirm connectivity when useful.
