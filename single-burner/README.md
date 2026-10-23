# Flambé Single Burner

The self-contained, one-machine Flambé.

Single Burner runs the Flambé UI and local API together on loopback, backed by SQLite. It is for people who want Flambé without setting up Elixir, PostgreSQL, or a hosted instance.

## Run it

```sh
npx @davvidbaker/flambe-single-burner
```

Then open http://127.0.0.1:4001.

The startup walkthrough explains how to install the agent CLI, copy the local connection settings into your agent project’s `.env`, give your agent the Flambé tracking instructions, and check the connection. It also explains what the local API token is for. Keep Single Burner running while your agent works.

## Install it

```sh
npm install -g @davvidbaker/flambe-single-burner
flambe-single-burner
```

Options:

```text
--port <n>   Port to listen on (default: 4001)
--db <path>  SQLite database path (default: ~/.flambe/local.sqlite)
```

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

## Use it through ChatGPT

For now, use the separate private **Single Burner** plugin alongside the hosted
Flambe plugin. One Flambe plugin that selects between both is still the preferred
experience, but grouping the connections has not been validated. This is a
temporary choice, not a confirmed platform limitation. See [why we chose it](../docs/ADR-020-instance-bound-chat-connections.md#temporary-chatgpt-plugin-decision--2026-10-22).

Single Burner exposes bearer-authenticated MCP tools at
`http://127.0.0.1:4001/mcp` using the local API token printed at startup. Connect
through a private MCP bridge reachable from ChatGPT and name that connection
**Single Burner**. See the [chat connection setup](../plugins/flambe/README.md#single-burner-and-development).

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
The following API/local options are alternatives when you want Flambe itself
to call a model.

| Mode | Model connection | Activity context |
| --- | --- | --- |
| `off` | None | No model request is sent |
| `agent` | Your current work AI | Returned through its existing tools; Flambe makes no inference request |
| `api` | OpenAI Responses-compatible HTTPS API | Sent directly to your selected model provider, never through Flambe Cloud |
| `local` | Ollama-compatible loopback endpoint | Sent to the runtime on this machine; use a model that performs inference locally |

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
64 KiB. Provider-backed review uses the current path, open work, and ended work
from the past 21 days; work-AI review uses the current path and its own open work.
Oversized context fails review explicitly before contacting the model; it is not
silently truncated.

`FLAMBE_LOCAL_REDUCER_TIMEOUT_MS` defaults to `30000` (maximum `90000`). Invalid
configuration stops startup with a configuration error. Explicitly set
`FLAMBE_LOCAL_REDUCER_MODE=off` to disable review again. No provider key is stored
by Single Burner; restart with the desired environment. This first version uses
one configured model, without Cloud's Jev or escalation-model chain. See
[ADR-021](../docs/ADR-021-optional-single-burner-ai-reducer.md).

## What is bundled

The npm package contains the built Flambé web UI. The local HTTP/SQLite engine currently comes from `@davvidbaker/flambe-cli`, so the behavior stays identical to the existing `flambe serve` path while the two distributions are separated.

`@davvidbaker/flambe-cli` remains the agent-facing command-line client. Single Burner is the runnable local app.
