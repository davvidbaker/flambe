---
name: flambe-cli
description: Track coding-agent work in a Flambe trace with the flambe CLI. Use when beginning, resuming, completing, or checking the status of work configured with FLAMBE_URL, FLAMBE_API_TOKEN, and FLAMBE_TRACE_ID.
---

# Flambe CLI

Record semantic work units, not individual shell commands or hidden reasoning.

## Resume or start work

1. Run `flambe status --active --json` before beginning work.
2. Inspect its `activities` array. An entry represents work whose latest event
   is a begin event; it includes the activity `id`, `name`, `threadId`, and
   latest event details.
3. Continue a matching activity when its scope clearly matches the requested
   work. Otherwise create one:

```sh
flambe start "Implement activity status"
```

Save the numeric activity ID printed by `start`.

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
