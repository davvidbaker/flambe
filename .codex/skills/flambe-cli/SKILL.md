---
name: flambe-cli
description: Track coding-agent work in a Flambe trace with the flambe CLI by framing execution as a live flame chart. Use when beginning, resuming, completing, or checking the status of work configured with FLAMBE_URL, FLAMBE_API_TOKEN, and FLAMBE_TRACE_ID.
---

# Flambe CLI

Treat Flambe as the execution model for the work, not as telemetry added after the fact.
The resulting flame chart should let a reader quickly understand what the agent worked on,
why that work existed, where time went, and what unexpected subproblems appeared.

Record semantic work units, not individual shell commands, transcripts, or hidden reasoning.

## Think in a flame chart

Maintain a live flame-chart representation of the work while executing it.
At any point, the currently active activities should form an understandable stack:

```text
User-visible objective
  -> Current workstream
      -> Current subproblem
```

The broadest active activity explains **why** the work is happening. The narrowest active
activity explains **what the agent is actually focused on now**.

Do not collapse the middle tier. When several steps share one goal — e.g. design, implement,
test, and document a single feature — they are the *subproblems of one workstream*, not
independent children of the objective. Give that workstream its own activity, keep it active
across all its steps, and nest the steps under it. Hanging `design`, `implement`, `test`,
`document` directly off the top objective — as siblings of every other concern in the task —
flattens the chart just as surely as omitting the steps would: the reader can no longer see
that those four bars were one coherent sub-effort. A multi-step sub-effort **is** an activity.

Do not do substantial unrepresented work. If meaningful time is being spent on something
that is not accurately described by the active stack, either:

- the current activity is too broad and a more specific activity should be started, or
- the work has changed and the prior leaf activity should be ended before starting the next one.

The chart should emerge from the work as reality changes. Do not invent a detailed flame
chart up front and then force the work to match it. A coarse initial frame is useful; discovered
prerequisites, debugging, redesign, verification, and other detours should appear when they
actually happen.

## What deserves an activity

Create a distinct activity when the nature, goal, or scope of the work meaningfully changes.
Common examples include:

- investigating a concrete uncertainty that must be resolved;
- designing or choosing an implementation approach;
- implementing a specific behavior or component;
- handling a newly discovered prerequisite;
- debugging a concrete failure or unexpected behavior;
- adding focused tests for the behavior being changed;
- verifying a meaningful property of the completed work.

Do not create activities for individual commands, opening files, routine searches, tiny edits,
or other low-level mechanics unless that action itself has become a meaningful problem.
Likewise, do not let a vague umbrella activity be the only bar for a long task when the work
clearly moved through several distinct concerns.

There is no fixed duration threshold. Prefer the granularity that makes the chart explain where
the effort went without turning it into command-by-command noise.

## Name activities for the actual work

Activity names should describe the concrete action and object. Prefer names that would still
be useful to someone looking at the chart later without the surrounding conversation.

Prefer:

```text
Trace Windows path assumptions
Separate FlameChart state from rendering
Fix USERPROFILE config resolution
Verify reconnect event ordering
```

Avoid vague names when a more specific one is known:

```text
Investigate
Implement
Fix issue
Work on tests
Run commands
```

Generic phase words such as "investigate", "implement", or "test" are fine only when the rest
of the name says what is actually being investigated, implemented, or tested.

## Maintain the active stack as work changes

Activities may stack: more than one activity can be active at once. Stacking represents
semantic containment: the narrower work exists in service of the broader active work.
Starting a newly discovered prerequisite does **not** require suspending the activity that
surfaced it.

For example, if implementation reveals a missing migration:

```text
Implement activity status
  -> Add missing status migration
```

Leave `Implement activity status` active while the migration is being added. End the migration
activity when that prerequisite is complete, then continue under the still-active implementation
activity.

When attention moves to a sibling concern, end the completed leaf and start the new leaf rather
than leaving unrelated activities active merely to create depth. Multiple activities should be
active simultaneously only when the overlap says something true about the relationship between
the work.

Before beginning a meaningful new concern, update Flambe so the chart reflects the change as it
happens. Do not reconstruct a polished trace after the work is finished.

## Start or resume work

The CLI requires Node.js 22 or newer. If the current shell uses an older runtime, switch to a
compatible project runtime before invoking it (for example, `nvm exec 22 flambe …`).

1. Run `flambe status --active --json` and `flambe status --suspended --json` before beginning
   work.
2. Inspect both `activities` arrays. Look for existing work whose scope matches the requested
   objective. An active entry has a latest begin or resume event; a suspended entry has a latest
   suspend event. Each entry includes the activity `id`, `name`, `threadId`, `threadName`,
   `categoryIds`, and latest event details.
3. Use `flambe threads --json` to inspect the available threads. `start` defaults to the row
   marked `default`; pass `--thread ID` whenever the work belongs on another thread. Use
   `flambe categories --json` to discover category IDs when categories help organize the work.
4. Choose the action that matches the real state of the work:
   - Continue an active matching activity when its scope still accurately describes the work.
   - Resume a suspended matching activity only when returning to work that was explicitly tabled.
   - Start a new activity when beginning a new semantic unit of work.
   - Start a narrower stacked activity when newly discovered work is in service of an active
     broader activity.
   - End a leaf activity when that semantic unit is complete or attention has moved to a sibling.
   - Suspend an activity only to explicitly table it: the agent is setting that work aside rather
     than continuing it or its prerequisites now. Include the reason. Do not suspend merely
     because its next step depends on other work, user input, or an external dependency.

For new work, create an activity:

```sh
flambe start "Implement activity status" --thread 14 --category 3
```

When the real start time is known and meaningful, create the activity with
`--started-at "YYYY-MM-DDTHH:MM:SS±HH:MM"`. It is optional and defaults to the current time;
do not guess a historical timestamp.

Save the numeric activity ID printed by `start`. The command prints only that ID so it can safely
be captured by scripts. `end` only needs the ID because the activity already belongs to its
original thread.

Table work with `flambe suspend ID "reason"`, then use `flambe resume ID "reason"` when returning
to it. Both commands print the event ID and support the same offline recovery as `start` and `end`.

## What a useful trace looks like

A useful trace tells the story of the work rather than merely proving that the agent was busy.
For example:

```text
Add Windows support
  -> Audit platform assumptions
      -> Trace config-path behavior
  -> Implement cross-platform config paths
      -> Fix USERPROFILE handling
  -> Add Windows path tests
  -> Verify Windows-compatible build
```

The exact activities should arise from the work that actually happened. If there was no
`USERPROFILE` problem, do not create that activity. If verification uncovers a new failure,
represent the debugging work that follows instead of hiding it inside `Verify ...`.

A poor trace is either too coarse:

```text
Add Windows support
```

or too mechanical:

```text
Open config file
Run grep
Edit line 42
Run npm test
Open another file
```

The goal is the middle: a flame chart that explains the agent's changing focus at the level a
technical collaborator would care about.

## Complete work and audit the chart

When a semantic unit is complete, close its matching activity with a concise result:

```sh
flambe end "$ACTIVITY_ID" "Added status output and tests"
```

Completion messages should capture the useful outcome, decision, or finding rather than merely
saying `done`.

At the end of the task, inspect the active activities and close the work that is actually
complete. Before considering the trace finished, mentally audit the resulting flame chart:

- Does it explain the major places the agent's attention went?
- Can a reader distinguish the important workstreams and subproblems?
- Are meaningful detours, debugging, and prerequisites visible?
- Are there vague long-running bars that conceal substantial changes in focus?
- Are there noisy low-level bars that do not help explain the work?
- Does the active stack reflect reality rather than a retrospective story?

If the chart would leave a collaborator asking "what were you actually doing during that time?",
the tracking was too coarse.

Do not record tokens, passwords, private data, long transcripts, or hidden reasoning in activity
names or completion messages.

## Configuration and recovery

The CLI loads `.env` from the current working directory. It requires `FLAMBE_URL`,
`FLAMBE_API_TOKEN`, and `FLAMBE_TRACE_ID`; never put the token in agent instructions or
version-controlled files.

## Install the Codex queue-flush hook

Install this once on each machine that runs Codex with Flambe. The hook is a
**global Codex hook**, so configure it in `~/.codex/config.toml`, not in a
project's `.codex/` directory. A global hook lets every Codex session flush the
queue when it starts, while the command below does nothing outside a project
that has Flambe configuration.

Ensure `flambe` runs with Node.js 22, then add the following to
`~/.codex/config.toml` (preserving any existing settings):

```toml
[features]
hooks = true

[[hooks.SessionStart]]
matcher = "startup|resume|clear|compact"

[[hooks.SessionStart.hooks]]
type = "command"
command = "bash -lc 'if [ -f .env ] || [ -n \"${FLAMBE_URL:-}\" ]; then flambe ping >/dev/null 2>&1 || true; fi'"
async = true
timeout = 10
statusMessage = "Flushing Flambe queue"
```

`flambe ping` invokes the CLI's normal pre-command queue flush before checking
connectivity. If the machine's default `node` is older than 22, make the hook
command invoke the Node 22 binary explicitly rather than relying on `flambe`'s
shebang.

After installing or changing the hook, open `/hooks` in Codex and trust the
exact hook definition. Codex skips untrusted local hooks. A newly installed
hook takes effect for the next session start.

When Flambe is temporarily unreachable, `flambe start` and `flambe end` save their operations
locally and print an `offline-…` activity ID (or `queued` for an end event) instead of losing the
work. Use that offline ID with `flambe end` as usual. On the next successful CLI command, Flambe
replays its compatible queued operations in order before handling the new command, then deletes
the local backlog and any resolved offline-ID mapping. The default queue is
`~/.flambe/event-queue.json`; set `FLAMBE_QUEUE_PATH` to override it. The queue contains operation
data only, never the API token.

If an operation is still queued, do not retry it manually: invoke any Flambe command once
connectivity returns and let the CLI flush it. Run `flambe ping` to confirm connectivity when
useful.
