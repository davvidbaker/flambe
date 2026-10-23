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

AI review is **off by default**. Set the mode in the environment of the
Single Burner server process, then restart that process. The CLI and ChatGPT
use the same configured reducer; agents do not need the provider credential.

| Mode | Model connection | Activity context |
| --- | --- | --- |
| `off` | None | No model request is sent |
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
64 KiB and uses the current path, open work, and ended work from the past 21 days.
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
