# Flambé Single Burner

The self-contained, one-machine Flambé.

Single Burner runs the Flambé UI and local API together on loopback, backed by SQLite. It is for people who want Flambé without setting up Elixir, PostgreSQL, or a hosted instance.

## Run it

```sh
npx @davvidbaker/flambe-single-burner
```

Then open http://127.0.0.1:4123.

Startup shows the local chart, reducer mode, copyable connection settings, and
three local Codex setup steps. Keep Single Burner running while your agent works.
Detailed guides are below; the hosted ChatGPT tunnel walkthrough is [separate](CHATGPT.md).

An empty `"activities": []` from `flambe status --active --json` means the
connection worked and no activity is running. Without `--json`, an empty list
prints nothing. Starting the server or checking status does not record work.
The printed local API token lets an agent write to this database; it is not an
npm or OpenAI credential. Existing shell `FLAMBE_*` values override project `.env`
settings, so update old connection values before starting your agent.

## Install it

```sh
npm install -g @davvidbaker/flambe-single-burner
flambe-single-burner
```

Starting in **0.1.12**, `fsb` is a shorter alias for the same launcher. All
options, `.env` loading, and subcommands behave identically:

```sh
fsb
fsb --version
fsb logs
```

On PowerShell, use `fsb.cmd` if execution policy blocks the generated `.ps1`
shim. The existing `flambe-single-burner` command remains available.

Options:

```text
--port <n>   Port to listen on (default: 4123)
--db <path>  SQLite database path (default: ~/.flambe/local.sqlite)
--log <path> Diagnostic JSONL log (default: <db path>.log)
--version   Show Single Burner and its bundled engine versions
```

## Server configuration from .env

Starting in **0.1.11**, server startup loads `.env` from the **current working
directory**, like `flambe serve`. Existing shell variables take precedence,
including old values from an earlier launch. A missing `.env` is fine. It does
not search parent directories or watch for changes: launch from the directory
containing the file, and restart the server after editing it.

For the independent Luna reducer, that file can contain:

```dotenv
FLAMBE_LOCAL_REDUCER_MODE=codex
FLAMBE_LOCAL_REDUCER_MODEL=gpt-6-luna
```

Then run `flambe-single-burner` from that directory. The dedicated Codex login
below is still required. Do not commit `.env` if it contains credentials.
Help, version output, and log viewing do not load `.env` or start a server.

## Diagnose activity placement

Single Burner writes a diagnostic log automatically, separate from the startup
output (which contains your API token). The startup heading includes the app
version; the banner also shows the log path, engine version, and reducer mode.

Starting in **0.1.9**, use the built-in readable viewer (no jq required, works on
Windows too):

```sh
flambe-single-burner logs
flambe-single-burner logs --no-follow --lines 50
flambe-single-burner logs --db /path/to/work.sqlite
flambe-single-burner logs --log /path/to/custom.log
flambe-single-burner logs --verbose
flambe-single-burner logs --json
```

By default it prints the last 30 useful events and follows new ones, including
across log rotation. Use `--lines 0` to watch only new events and Ctrl+C to stop.
If the log does not exist yet, it waits for the server to create it. The viewer
does **not** start a server or open your database. It reads the existing 0.1.8
log format, so the server need not be upgraded or restarted to view its log.

Readable output hides received/recorded duplicates and successful status polls,
showing completed commands and failures instead. Times are UTC, matching the
underlying log. For example:

```text
17:41:05 START   #305  → thread 2  (fallback)  WAITING for thread-selection review
17:44:37 START   #307  → thread 2  inherited from parent #303
17:45:24 DECIDE  #306  → thread 3  (AI placement)  review completed
```

`--verbose` includes intermediate stages and full request, agent, and review
identifiers. `--json` prints original JSON records, including intermediate
stages, for piping to other tools. Missing activity/review ids in older failed
records cannot be reconstructed reliably; failures show a short request and
agent id instead. Thread names and activity text are not in the diagnostic
file, so the viewer displays numeric ids rather than querying the database.
Malformed records are skipped with a warning; incomplete lines wait until their
newline arrives. For one-shot reads, a missing log is an error.

You can also tail the underlying file directly. With the default database:

```sh
tail -F ~/.flambe/local.sqlite.log
# Optional: only completed commands, formatted with jq
tail -F ~/.flambe/local.sqlite.log | jq --unbuffered 'select(.event == "command.completed")'
```

On Windows PowerShell:

```powershell
Get-Content "$HOME/.flambe/local.sqlite.log" -Tail 30 -Wait
```

Use `--log <path>` to choose another location. Logs rotate at 5 MiB, retaining
one previous file (`.log.1`); `tail -F` follows rotation. Each command has a
`request_id` linking `command.received`, `command.recorded` (before optional
model review), and `command.completed` or `command.failed`. Commands arriving
through both the agent CLI and MCP use this log. It is **not** a browser access
log; manual UI edits do not pass through the agent command reducer.

Key fields:

- `agent_id`, `trace_id`, `activity_id`: which agent and work were involved.
- `requested_thread_id`, `parent_specified`, `requested_parent_id`: what the
  client actually sent. An environment default such as `FLAMBE_THREAD` arrives
  as a requested thread, indistinguishable from an explicit `--thread` here.
- `selected_thread_id`, `selected_parent_id`, `thread_source`, `parent_source`:
  the actual placement. Thread source `default` means first-ranked thread,
  `parent` means inheritance, `request` means an explicit lane, and
  `existing_activity` means a duplicate or planned activity was reused, and
  `review` means an AI decision selected a thread or reparented the activity.
- `review_context`: safe byte counts, omitted activity counts, and shortened-field
  counts for successful independent reviews; no context text.
- `review_model`, `review_usage`: model id and token counts/duration for successful
  Codex reviews (available in `logs --json`, not a dollar-cost estimate).
- `reducer_mode`, `rules_fired`, `review_status`, `review_id`,
  `thread_selection_requested`, `actions_applied`, `review_error_code`:
  whether AI selection was requested, awaits the work AI, completed, or failed.
  Compare recorded and completed placement when a model selects another thread.
  A later `decide` completion records the work AI's chosen thread.

No API tokens, request headers, activity names/descriptions/messages, model
context, or decision rationale are logged. Logs do contain local activity and
agent identifiers; inspect them before sharing. New log files use owner-only
permissions where supported. Logging failures warn once on stderr and do not
fail or retry recorded work.

### Why an activity can land on the wrong thread

1. **Older server:** initial AI thread selection shipped in **0.1.7**. Single
   Burner 0.1.6 pinned engine 0.1.5, so upgrading only your global agent CLI
   does not update the server's engine. Check both installed packages with
   `npm ls -g @davvidbaker/flambe-single-burner @davvidbaker/flambe-cli`; this
   build also provides `flambe-single-burner --version`. For npx installs, run
   `npx @davvidbaker/flambe-single-burner@latest` explicitly. Stop the old server
   and restart after updating; an already running process keeps its old code.
2. **Reducer off (the default):** a root without a requested thread goes to the
   first thread ordered by rank, then id. There is no semantic/project-name
   selection in this mode. Configure `FLAMBE_LOCAL_REDUCER_MODE=agent` in the
   **server's** environment and restart to let your work AI choose.
3. **Parent inheritance:** without `--root` or `--parent`, a start nests beneath
   that agent's newest running activity, across threads. Children stay on the
   parent's thread even if `--thread`/`FLAMBE_THREAD` requested another. Finish
   stale work, or use `--root` when genuinely starting a separate workstream.
   Reusing one `FLAMBE_AGENT_ID` across independent sessions can pick up another
   session's open work; let the harness derive per-session identities.
4. **Explicit lane:** `--thread`, MCP `thread_id`, or `FLAMBE_THREAD` prevents
   automatic initial selection on a root. Check both shell and project `.env`;
   shell configuration wins. An inherited lane is also not re-selected.
5. **Unfinished/failed review:** in `agent` mode, the work AI must submit the
   initial review with `decide`; until then the root remains on the fallback
   lane. Merely enabling agent mode is not a background classifier. API/local/Codex
   provider review can fail or reject a stale snapshot while preserving the
   already recorded activity. Update the agent skill/hooks too, so reviews
   are completed rather than ignored.

Diagnostic logging and version output are available starting in **0.1.8** of
Single Burner and its bundled CLI engine. Version 0.1.7 supplies initial thread
selection, but not this diagnostic log.

Single Burner binds loopback only. Agents on other machines need a private bridge
to reach it, or can use a separately hosted Flambe instance.

## Use it with local Codex

Local Codex connects directly to Single Burner; no ChatGPT remote plugin,
Platform organization, tunnel, or model API key is needed. Copy the server's
connection values into the project `.env`, including the local-only runtime
mode, then run from that project's root:

```sh
flambe setup codex
```

Restart local Codex and review/trust the hooks through `/hooks`. The setup
preserves unrelated hooks and existing custom skills. Hooks provide recurring
workflow checkpoints, while Codex owns meaningful activity names, nesting, and
work-AI reducer decisions. Keep Single Burner and the global CLI available.
Use `flambe setup codex --check` to inspect files and `--remove` to remove only
Flambe's handlers. See [hook behavior and verification](../cli/README.md#local-codex--single-burner-hooks).

## Use it with another local coding agent

Install `@davvidbaker/flambe-cli`, copy the printed connection values to the
agent project's `.env` (keep it out of Git), and add this to its instructions:

> Use Flambé to track substantial work. Run the flambe CLI from this project's
> directory so it reads .env. Follow the flambe-cli skill: start activities,
> nest focused work under its parent, and end activities with their outcomes.

Follow the [flambe-cli skill](../.codex/skills/flambe-cli/SKILL.md).
The agent must run on this machine and be able to reach the printed address;
a cloud-hosted agent cannot reach this machine's localhost.

## Use it through ChatGPT

For now, use the separate private **Single Burner** plugin alongside the hosted
Flambe plugin. One Flambe plugin that selects between both is still the preferred
experience, but grouping the connections has not been validated. This is a
temporary choice, not a confirmed platform limitation. See [why we chose it](../docs/ADR-020-instance-bound-chat-connections.md#temporary-chatgpt-plugin-decision--2026-10-22).

Single Burner exposes bearer-authenticated MCP tools at
`http://127.0.0.1:4123/mcp` using the local API token printed at startup. Connect
through a private MCP bridge reachable from ChatGPT and name that connection
**Single Burner**. Follow the [complete tunnel and plugin walkthrough](CHATGPT.md), including
Windows/Git Bash commands, workspace association, skill installation, and a live check.

The first `flambe_traces` call identifies this database and lists its traces.
Other tools require its exact `instance.id` as `expected_instance_id`, so an id
from Cloud, Development, or a different local database is rejected before any
activity is accessed. Every result identifies its instance. Instance selection
stays with the chat until you explicitly switch; Single Burner never forwards
activity or model-review requests to Cloud.

Keep both Single Burner and its tunnel client running while using the ChatGPT
connection. The verified development setup does not start them automatically.

## Optional AI reducer

To use the AI already helping with your work, start Single Burner with:

```sh
export FLAMBE_LOCAL_REDUCER_MODE=agent
flambe-single-burner
```

This needs no model API key, Ollama, or extra model process. Configure this on
the Single Burner server; your agent only needs its normal local connection.
Refresh MCP tool discovery after updating/restarting the server.

The work AI calls `flambe message` / `flambe_message` to receive review context,
instructions, a decision schema, and a `review_id`. Routine tracking is
deterministic; flagged starts return a small notice without review context.
The activity is already recorded. The AI evaluates the packet and submits a decision using `flambe decide <review-id> --file decision.json`
or the Single Burner-only `flambe_decide` tool. The decision JSON contains
`assessment`, `direction`, `reply`, `rationale`, and `actions`, matching the
returned schema. Follow the CLI or plugin skill to complete the review before
continuing work. Ordinary tracking still uses the normal lifecycle commands.

Single Burner applies allowed decisions locally, rejects stale or expired
reviews, and records who submitted them. A pending review survives restart and
expires after 15 minutes. Identical retries return a receipt without applying
another change; different decisions for a completed review are rejected. Local
review records/receipts become eligible for cleanup after 24 hours and are
removed when another review is requested and are excluded from history exports. The work AI reviews
its own context; this is not independent approval or a background service.
With a cloud-hosted work AI, the returned context still reaches that provider.
Reviews consume the current chat model's context and allowance; they do not
switch to a cheaper model automatically. Request them at meaningful scope or
approach decisions, not for every lifecycle event. Work-AI reviews include the
current path and this agent's open work, omitting unrelated and ended history.
Routine replies mark their compact state scope; an explicit status read can
still return full history. Set `FLAMBE_LOCAL_REDUCER_REVIEW_STARTS=true` on the
server to opt into automatic full reviews for flagged starts (default `false`).
See [ADR-022](../docs/ADR-022-work-ai-reducer-reviews.md).

AI review is **off by default**. Set the mode in the environment of the
Single Burner server process, then restart that process. The CLI and ChatGPT
use the same configured reducer; agents do not need a separate provider credential.
The following API/local/Codex options are alternatives when you want Flambe itself
to call a model independently of the work AI.

| Mode | Model connection | Activity context |
| --- | --- | --- |
| `off` | None | No model request is sent |
| `agent` | Your current work AI | Returned through its existing tools; Flambe makes no inference request |
| `api` | OpenAI Responses-compatible HTTPS API | Sent directly to your selected model provider, never through Flambe Cloud |
| `local` | Ollama-compatible loopback endpoint | Sent to the runtime on this machine; use a model that performs inference locally |
| `codex` | Official pinned Codex runtime with a dedicated login | Sent to the Codex service under that account; not local inference |

### Independent Codex reducer

Available in **Single Burner 0.1.10 (engine 0.1.9)** and later.
From **0.1.11**, the mode and model can also be set in the launch directory's
[`.env` file](#server-configuration-from-env), instead of shell exports.

This is an independent reviewer, not another coding worker or merely a thread
classifier. It reviews worker messages and flagged structural starts, can return
scope/approach guidance, clarify activity intent, and propose an unstarted child.
Structural reviews can also ask questions and correct parent placement, with
the same action permissions as API/local mode.
Single Burner still owns validation, transactions, and all state changes. No
work-AI `decide` round trip is needed. Existing API/local modes remain available.

FSB prints the dedicated-profile login command at startup in Codex reducer mode.
If a review detects a missing or expired login, the server terminal prints that
command again and the review error includes recovery instructions. Sign in from
another terminal, then retry the review; no FSB restart is needed. Repeated auth
failures warn once until a review succeeds, and recorded work is preserved.

First sign in **once** using a dedicated profile. In bash/zsh/Git Bash:

```sh
CODEX_HOME="$HOME/.flambe/reducer-codex" npx --yes @openai/codex@0.166.0 login

export FLAMBE_LOCAL_REDUCER_MODE=codex
export FLAMBE_LOCAL_REDUCER_MODEL='gpt-6-luna'
flambe-single-burner
```

In PowerShell, scope `CODEX_HOME` to the login command and then restore it:

```powershell
$previousCodexHome = $env:CODEX_HOME
try {
  $env:CODEX_HOME = Join-Path $HOME '.flambe/reducer-codex'
  npx --yes @openai/codex@0.166.0 login
} finally { $env:CODEX_HOME = $previousCodexHome }
$env:FLAMBE_LOCAL_REDUCER_MODE = 'codex'
$env:FLAMBE_LOCAL_REDUCER_MODEL = 'gpt-6-luna'
flambe-single-burner
```

These examples select **Luna (`gpt-6-luna`)**, listed in the
[official Codex model documentation](https://developers.openai.com/codex/models)
and the pinned runtime's model catalog with low-effort support. This is an
explicit choice, not an implicit default or a measured quality/cost guarantee.
You can choose another model available to that Codex account that supports
structured output and **low reasoning effort**. There is no implicit model selection, stronger-model
escalation or cross-provider fallback. Single Burner does not retry a review;
Codex may retry transient transport failures within the configured timeout.
Account availability, allowance/billing, quality, and latency depend on Codex;
this mode does not promise free or local inference. For a headless login, use
Codex's `login --device-auth` if available to your account.

`FLAMBE_LOCAL_CODEX_HOME` overrides the reducer profile path. Use the same path
as `CODEX_HOME` only for the one-time login, not as the server's ambient
`CODEX_HOME`: worker-profile reuse is rejected. Do not put `AGENTS.md` or
`AGENTS.override.md` in the reducer profile; these files stop review rather than
being silently imported. Codex may persist its authentication, caches, and
runtime diagnostics there; keep that directory private. Single Burner does not
read, copy, or log its credentials.

The official npm runtime is an optional engine dependency, pinned to **0.166.0**.
There is no global Codex binary lookup or arbitrary executable configuration.
If optional dependencies were omitted, reinstall the engine with them enabled.
Only `codex` mode requires this runtime; the other modes still work without it.

Each review uses a fresh ephemeral process and temporary working directory.
A restricted custom model catalog keeps the exact selected model id but declares
no agent tools; otherwise Codex model metadata can enable tools independently of
feature flags. The profile uses ordinary Responses structured output and does
not infer a context-window size or enable automatic compaction.
User configuration and execpolicy rules are ignored; project instructions,
host skills, hooks, MCP/plugin connections, shell execution, web search, file
editing, and other agent capabilities are disabled. The runtime is also
read-only/noninteractive, receives no worker Flambe connection/identity or ambient
provider tokens, and unexpected tool operations abort review. A native-runtime
fixture verifies an empty outbound tool catalog and exclusion of inherited
instructions using only a loopback mock endpoint. This is an inference profile,
not a general OS/container security boundary against a compromised local runtime
or administrator-managed configuration.

Successful reviews include bounded token counts, duration and runtime version
in their audit record and JSON diagnostics. Temporary input files are removed
when the process exits; a hard server crash can leave a private temporary
directory to clean up. Ephemeral mode suppresses Codex session transcripts, not
all runtime diagnostics or provider-side retention.

This adds a transport to the existing reducer, not full Cloud parity. It retains
the conservative whole-trace stale-review guard: concurrent edits, including
unrelated/audit changes, can reject a review. Already recorded lifecycle work is
preserved. Cloud category selection, richer unstarted-work context, semantic
conflict guards, and escalation remain separate work.

### API and local model alternatives

For an API provider, choose a model available in your provider account and enter
the dedicated key in the terminal without echoing it or putting it in shell history:

```sh
export FLAMBE_LOCAL_REDUCER_MODE=api
export FLAMBE_LOCAL_REDUCER_MODEL='your-model-id'
read -rs FLAMBE_LOCAL_REDUCER_API_KEY
export FLAMBE_LOCAL_REDUCER_API_KEY
flambe-single-burner
```

The default API base is `https://api.openai.com/v1/`; the server appends
`responses`. Set `FLAMBE_LOCAL_REDUCER_BASE_URL` for another compatible HTTPS
base. Neither the tunnel's key nor an unrelated `OPENAI_API_KEY` is reused.

For an already installed local model, keep its runtime running and select it:

```sh
export FLAMBE_LOCAL_REDUCER_MODE=local
export FLAMBE_LOCAL_REDUCER_MODEL='your-installed-model'
flambe-single-burner
```

Local mode defaults to `http://127.0.0.1:11434/` and appends `api/chat`. A custom
base must use loopback. It does not send an API key, follow redirects, download
a model, or fall back to a remote provider. Known cloud-model tags are rejected;
also verify that your chosen runtime/model actually performs inference locally.

Review runs for `flambe message` / `flambe_message` and structural starts that
need judgment (a new root while work is open or a child name that does not fit
its ancestors). Normal start/end/suspend/resume rules keep working without a
model. An unavailable model causes an explicit message error; an already
recorded lifecycle proposal remains successful with
`model_review.status: failed` and an error code. The CLI displays that failure. Do not repeat the
start merely because its optional review failed.

Model decisions can clarify an activity or propose an unstarted child; structural
reviews can also ask a question or reparent the new activity. Single Burner
validates every proposal, enforces advice-only requests, and rejects judgments
if the trace changed during inference. Model changes and audit events commit
together. Models cannot delete or end activities. Review context is bounded to
64 KiB. Starting in **Single Burner 0.1.13 (engine 0.1.10)**, API/local/Codex
reviews budget the snapshot instead of failing when recent history accumulates:

- Keep the current activity, its complete ancestry, eligible placement candidates
  and their ancestry, and the complete thread catalog. Names/ids/statuses stay intact.
- Prefer intact root/current descriptions. Under pressure, shorten other required
  descriptions and lifecycle notes first, then root/current descriptions only if
  necessary. Shortened strings retain both ends and are explicitly marked; they
  are not model-generated summaries and never change stored history.
- Fit additional own open work, other open work, then recent ended work (21 days),
  favoring the current lane and newest evidence within each priority group.
- `context_budget` reports omitted open/ended activity counts and shortened fields.
  The model must not infer completion/irrelevance from missing work or rewrite
  intent based on omitted facts. Only visible activities remain mutation targets;
  a description shown only in shortened form cannot be overwritten by the reviewer.

Successful review audit records and `fsb logs --json` include `review_context`
byte/omission/shortening counts, without recording context text. The full review
message, thread catalog, and required structural core are not silently dropped:
if these alone cannot fit, review still explicitly fails before inference.
Work-AI (`agent`) review retains its existing compact current-path/own-open-work
scope and oversized-context guard. Existing stale-review checks, action limits,
advice-only enforcement, and preservation of recorded lifecycle work remain in force.

`FLAMBE_LOCAL_REDUCER_TIMEOUT_MS` defaults to `30000` (maximum `90000`). Invalid
configuration stops startup with a configuration error. Explicitly set
`FLAMBE_LOCAL_REDUCER_MODE=off` to disable review again. API/local keys are not
stored by Single Burner; Codex owns its dedicated profile's authentication.
Restart with the desired environment. This first version uses
one configured model, without Cloud's Jev or escalation-model chain. See
[ADR-021](../docs/ADR-021-optional-single-burner-ai-reducer.md).

## What is bundled

The npm package contains the built Flambé web UI. The local HTTP/SQLite engine currently comes from `@davvidbaker/flambe-cli`, so the behavior stays identical to the existing `flambe serve` path while the two distributions are separated.

`@davvidbaker/flambe-cli` remains the agent-facing command-line client. Single Burner is the runnable local app.
