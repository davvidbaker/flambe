---
name: flambe-cli
description: Track coding-agent work in a Flambe trace with the flambe CLI. Use when beginning, resuming, completing, or checking the status of work configured with FLAMBE_URL, FLAMBE_API_TOKEN, and FLAMBE_TRACE_ID.
---

# Flambe CLI

Record semantic work units, not individual shell commands or hidden reasoning.

## Resume or start work

The CLI requires Node.js 22 or newer. If the current shell uses an older
runtime, switch to a compatible project runtime before invoking it (for
example, `nvm exec 22 flambe …`).

1. Run `flambe status --active --json` before beginning work.
2. Inspect its `activities` array. An entry represents work whose latest event
   is a begin event; it includes the activity `id`, `name`, `threadId`,
   `threadName`, `categoryIds`, and latest event details.
3. Use `flambe threads --json` to inspect the available threads. `start`
   defaults to the row marked `default`; pass `--thread ID` whenever the work
   belongs on another thread. Use `flambe categories --json` to discover
   category IDs, when categories help organize the work.
4. Continue a matching activity when its scope clearly matches the requested
   work. Otherwise create one:

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
agent instructions or version-controlled files. Run `flambe ping` to confirm
connectivity before retrying a failed command.
