# @davvidbaker/flambe-cli

Node 22 CLI that streams coding-agent work into a Flambe trace.

## Install

```sh
npm install -g @davvidbaker/flambe-cli
```

That puts `flambe` on `PATH`. One-off:

```sh
npx @davvidbaker/flambe-cli --help
```

From this checkout (no npm):

```sh
node cli/bin/flambe.mjs --help
# or
cd cli && npm link
```

## Cursor Cloud and other repos

1. Install the CLI in the environment (or at the start of an agent session):

   ```sh
   npm install -g @davvidbaker/flambe-cli
   ```

2. Set Cloud secrets / env: `FLAMBE_URL`, `FLAMBE_API_TOKEN`, `FLAMBE_TRACE_ID`.
   Optional: `FLAMBE_THREAD` (name, unique slug, or id) is sent on `start` when
   `--thread` is omitted. Do not list threads and pick one by project name.
   Copy the `flambe-cli` skill from this repo (`.codex/skills/flambe-cli`) so
   agents know when to `start` / `end`.

3. Set `FLAMBE_AGENT_PLATFORM` to the product (`Cursor Cloud`) as a Cloud
   secret; it is shared by every agent there. Agents do not need a name: the
   reducer assigns one on first contact and the CLI remembers it
   (`flambe whoami`). Set `FLAMBE_AGENT_NAME` only to override. Do not put
   `FLAMBE_AGENT_ID` or `FLAMBE_AGENT_NAME` in `.env`.

CI publishes this package from `cli/` via npm trusted publishing when
`cli/package.json` on `main` changes. Local `npm publish` needs access to
`@davvidbaker`.

## Configure

Create a `.env` in the project working directory (or set the same names in the
shell; shell wins):

```dotenv
FLAMBE_URL=https://your-app.fly.dev
FLAMBE_API_TOKEN=flb_...
FLAMBE_TRACE_ID=1
# FLAMBE_THREAD=flambe
```

Mint a token in Flambe Settings → API tokens. See the
[repository README](https://github.com/davvidbaker/flambe#connect-coding-agents)
for commands (`start`, `end`, `message`, `observe`, local `serve`).

## Single Burner AI review

When running `flambe serve`, optional AI review is configured in that server
process with `FLAMBE_LOCAL_REDUCER_MODE=off|agent|api|local`. It is off by default;
provider failures never reroute work to Cloud. See the
[Single Burner configuration guide](../single-burner/README.md#optional-ai-reducer)
for model, endpoint, credential, timeout, and data-boundary settings. Client
processes only need their normal local Flambe connection settings.

In `agent` mode, your current work AI reads the review returned by `flambe message`
and submits its decision with `flambe decide <review-id> --file <decision.json>`.
No separate model or inference API key is required.

## Local Codex / Single Burner hooks

With Single Burner running, put its printed connection values in the target
project's `.env`, including `FLAMBE_RUNTIME_MODE=local_self_contained`. From
that project root run:

```sh
flambe setup codex
```

This installs project-scoped Codex hooks and the bundled `flambe-cli` skill.
It preserves unrelated hooks, backs up an existing `hooks.json` once, and keeps
an existing custom skill rather than overwriting it. Restart local Codex, open
`/hooks`, and review/trust the new definitions. Hook loading remains subject to
project trust and workspace policy. No ChatGPT plugin, Platform organization,
tunnel, or model API key is needed for this local route.

Keep `flambe` available on PATH to the Codex process. Hooks use `flambe.cmd` on
Windows and `flambe` on macOS/Linux, with no machine-specific checkout paths.
If you installed the CLI while Codex was already open, restart the app so it can
see the updated PATH.

- Session start, resume, prompts, subagent start, and compaction restore context.
- Tool hooks use a small cache, refresh local status at most once per 30 seconds
  during ordinary work, and request a fresh stack check every ten tool calls or
  90 seconds while tools continue. Explicit lifecycle checkpoints reset the
  call counter; a timer does not run while the agent is idle.
- Stop requests at most one reconciliation continuation after substantial tool
  work without a verified checkpoint. It does not automatically close parents.
- Interrupt records a pending local reconciliation reminder; it does not mutate
  activities or prevent interruption.

The agent still names/nests activities, decides when work changed, and submits
requested reducer decisions. Hooks only send status requests to the configured
numeric-loopback server. They do not call a model, inspect transcripts, or
queue activity mutations. Missing configuration, an unavailable server, or an
unidentifiable agent produces bounded feedback and permits work to continue.
The local cache contains counters/fingerprints, not prompts, command text,
credentials, or activity names. See [ADR-023](../docs/ADR-023-portable-local-codex-hooks.md).

```sh
flambe setup codex --check
flambe setup codex --remove
```

`--check` inspects installed files and local connection configuration; it cannot
confirm a live server, Codex trust, or workspace policy.
`--remove` retains skills and unrelated hooks. For a live check, restart Codex,
confirm these hooks are trusted in `/hooks`, then ask it to track a short local
activity, request/submit an agent-mode review, and end or suspend the activity.
Verify that the chart and that agent's lane reflect the result. A fresh install
on the work laptop still needs this native Codex verification.
