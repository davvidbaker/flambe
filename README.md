<p align="center">
  <img src="frontend/public/pwa-512.png" alt="Flambé logo" width="112" />
</p>

<h1 align="center">Flambé</h1>

<p align="center"><strong>See where the work actually went.</strong></p>

<p align="center">
  A glorified todo app organized like a profiler.<br />
  Flambé turns human and agent work into a live flame chart, so nested work stays visible.
</p>

<p align="center">
  <a href="https://github.com/davvidbaker/flambe/actions/workflows/phase-0.yml"><img src="https://github.com/davvidbaker/flambe/actions/workflows/phase-0.yml/badge.svg" alt="App tests and deployment" /></a>
  <a href="https://www.npmjs.com/package/@davvidbaker/flambe-cli"><img src="https://img.shields.io/npm/v/%40davvidbaker%2Fflambe-cli?label=CLI&color=f97316" alt="npm CLI version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-f97316" alt="MIT license" /></a>
  <img src="https://img.shields.io/badge/Node-22%2B-334155" alt="Node 22+" />
</p>

<p align="center">
  <a href="https://flambe-share.vercel.app"><img src="https://img.shields.io/badge/View_sample_timeline-f97316?style=for-the-badge" alt="View sample timeline" /></a>
  <a href="#quick-start-single-burner"><img src="https://img.shields.io/badge/Run_Single_Burner-334155?style=for-the-badge" alt="Run Single Burner" /></a>
</p>

<p align="center">
  <a href="#what-is-flambé">What is it?</a> ·
  <a href="#choose-how-to-run-flambé">Choose a version</a> ·
  <a href="#quick-start-single-burner">Quick start</a> ·
  <a href="#connect-coding-agents">Agents</a> ·
  <a href="#hosted-flambé">Hosted</a> ·
  <a href="#develop-flambé">Develop</a> ·
  <a href="#docs">Docs</a>
</p>

<p align="center">
  <a href="https://flambe-share.vercel.app">
    <img src="docs/images/flambe-timeline.png" alt="Actual Flambé timeline with nested human and agent activities across threads" width="900" />
  </a>
</p>

<p align="center"><em>Actual Flambé UI. The link opens a read-only sample timeline.</em></p>

## What is Flambé?

Most task systems flatten work into a list. Real work is not a list. It is a stack of interruptions, detours, subtasks, investigations, and agent runs.

Flambé keeps that shape.

Activities **nest** and sit on a **timeline**, the way a profiler shows a call stack. Start a task, descend into a subproblem, hand something to an agent, come back up, and the chart preserves that structure.

Coding agents can report into the same trace, so your work and their work share one flame.

| Instead of... | Flambé gives you... |
|---|---|
| A flat list of boxes | Nested activities with parent/child structure |
| "Where did the afternoon go?" | A timeline you can actually inspect |
| Agent work disappearing into terminal scrollback | Agent activity on the same chart as yours |
| Logging every tiny action | A high-level stack of meaningful work |
| Rabbit holes hidden in notes or terminal history | Rabbit holes visible in context |

**[View the sample timeline →](https://flambe-share.vercel.app)** and pan or zoom it in your browser.

## Choose how to run Flambé

There are three useful ways to run Flambé. They use the same activity model and UI, but they are meant for different situations.

| | **Single Burner** | **Hosted Flambé** | **Development checkout** |
|---|---|---|---|
| Best for | One person on one machine | Multiple machines or remote/cloud agents | Working on Flambé itself |
| App stack | Bundled web UI + local API | Phoenix app + web UI | Phoenix backend + Vite frontend |
| Data | SQLite | PostgreSQL | PostgreSQL |
| Network | Loopback only | Network-accessible | Local development servers |
| Setup | One `npx` command | Deploy with Fly.io or Docker | Clone the repo and install dev dependencies |
| Cloud agents | No | Yes | Only if you expose the dev instance yourself |

### Single Burner

**Single Burner is the normal local app.** It packages the Flambé UI with the local API and SQLite runtime, so you can use Flambé without installing Elixir, PostgreSQL, or deploying anything.

Use it when Flambé and your coding agents are running on the same computer.

### Hosted Flambé

**Hosted Flambé is the networked production shape.** It runs the Phoenix application with PostgreSQL and gives remote machines and cloud-hosted agents an address they can reach.

Use it when you want Flambé across multiple machines, need cloud agents to report into it, or want a persistent self-hosted instance.

### Development checkout

**The repository checkout is for developing Flambé.** It runs the backend and frontend development servers separately and requires the full Node, Elixir, and PostgreSQL toolchain.

You do not need to clone this repository just to use Flambé.

### Companion tools

These are not separate versions of Flambé:

- **`@davvidbaker/flambe-cli`** is the agent-facing command-line client. It can talk to either Single Burner or Hosted Flambé.
- **Desktop status flame** is a small macOS/Windows helper that shows recent agent activity.
- **Public timeline viewer** displays shared snapshots, including the sample linked above. It is not a writable Flambé instance.

## Quick start: Single Burner

Requires Node 22 or newer.

```sh
npx @davvidbaker/flambe-single-burner
```

Open **http://127.0.0.1:4001**.

Single Burner runs the web UI and local API together, backed by SQLite. The process prints `FLAMBE_URL`, `FLAMBE_API_TOKEN`, and `FLAMBE_TRACE_ID` so local coding agents can write into the same flame.

If you want a global command instead:

```sh
npm install -g @davvidbaker/flambe-single-burner
flambe-single-burner
```

Options:

```text
--port <n>   Port to listen on (default: 4001)
--db <path>  SQLite database path (default: ~/.flambe/local.sqlite)
```

Single Burner binds to loopback only. If an agent runs in the cloud or on another machine, use [Hosted Flambé](#hosted-flambé).

<details>
<summary><strong>Moving local history to a hosted instance</strong></summary>

The CLI can export selected local history and import it into a hosted instance:

```sh
flambe export work.json
flambe import work.json --url https://your-app.fly.dev --token flb_...
```

Import creates a **new** trace on that account, or skips it if that export was already imported. Tokens and credentials are not part of the file.

</details>

## Connect coding agents

Agents use the CLI to report activities into either Single Burner or Hosted Flambé.

Install the CLI:

```sh
npm install -g @davvidbaker/flambe-cli
```

For **Single Burner**, use the `FLAMBE_URL`, `FLAMBE_API_TOKEN`, and `FLAMBE_TRACE_ID` printed when it starts.

For **Hosted Flambé**, create a token in **Settings → API tokens** and configure the project where the agent runs:

```dotenv
FLAMBE_URL=https://your-app.fly.dev
FLAMBE_API_TOKEN=flb_...
FLAMBE_TRACE_ID=1
# FLAMBE_THREAD=flambe
```

Then an agent can report meaningful work as a stack:

```sh
ACTIVITY_ID=$(flambe start "Inspect authentication flow")
flambe end "$ACTIVITY_ID" "Confirmed bearer-token path"
flambe message "Auth fix needs the session module refactored too; widening scope"
```

`start` nests under that agent's newest active activity unless you pass `--parent` or `--root`. `message` asks the reducer whether the work is still on track; it needs `OPENAI_API_KEY` on the server. Lifecycle commands (`start`, `end`, `suspend`, `resume`) work without a model.

Copy the `flambe-cli` skill into the agent product you use ([`.cursor/skills/flambe-cli`](.cursor/skills/flambe-cli), [`.codex/skills/flambe-cli`](.codex/skills/flambe-cli)) so agents treat the trace as a live stack rather than logging every shell command.

Hosted agents can call the same commands over MCP at `/mcp` with `Authorization: Bearer <API_TOKEN>`. Browser login cookies do not authenticate the MCP endpoint. The server prefers MCP `2026-07-28` and retains legacy initialization compatibility during migration.

On the chart, an agent's neon green rail smoothly fades from fully transparent to fully visible when it has open work and Flambé heard from it within the last minute. Completed work and older or unknown contact keep the rail's usual provider color, with no separate contact dot. Activity details show the last-contact status as text. Reduced motion keeps the recent rail steadily visible. This records contact with Flambé, so an agent can go quiet while still working. Open activities keep their lifecycle status until explicitly ended or suspended. Confirming execution between updates would require a signal from the agent's runtime.

See the **[CLI README](cli/README.md)** for installation, Cloud secrets, and command details.

<details>
<summary><strong>Environment-variable rules</strong></summary>

Shell environment variables win over `.env`. Do not commit `.env`.

Do not put `FLAMBE_AGENT_ID`, `FLAMBE_AGENT_NAME`, or `FLAMBE_AGENT_PLATFORM` in `.env`. The CLI derives those from the session, and the reducer names unnamed agents.

</details>

## Hosted Flambé

The hosted production stack is a Phoenix 1.8 app with PostgreSQL: invite-gated signup, one Machine, and in-memory agent presence. Fly.io is the deployment path this repo ships with (`Dockerfile` + `fly.toml`), and the same image can run elsewhere with PostgreSQL and the required secrets.

**[Host your own Flambé →](docs/SELF_HOSTING.md)** covers Fly setup, secrets, first login, GitHub deploys, and running the Docker image elsewhere.

For now, keep `fly scale count` at 1. A second Machine would split presence until that signal moves out of memory.

## Develop Flambé

This section is for working on Flambé itself, not for normal installation.

Requirements: **Node 22 LTS**, **Elixir 1.18 / OTP 27**, and **PostgreSQL**. Native Windows, macOS, and Linux are supported.

```sh
cd backend
mix deps.get
mix ecto.create
mix ecto.migrate
mix phx.server
```

In another terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open **http://localhost:5173**, register, and you land on the default `Main` trace. Vite proxies API, auth, and socket requests to Phoenix at `http://localhost:4001`.

<details>
<summary><strong>Development notes</strong></summary>

On Windows, install Visual Studio Build Tools with the **Desktop development with C++** workload. `bcrypt_elixir` needs it. The repo's Windows scripts locate that toolchain.

The backend defaults to `localhost:5432` with `postgres` / `postgres`. Override with the usual `PG*` environment variables if yours differ.

On Windows, run `scripts\windows_setup.cmd` and then `mix phx.server`.

Local Mix omits `FLAMBE_INVITE_CODE` unless you set it. `mix flambe_next.seed_e2e` from `backend` seeds the browser-test account.

`npm run build` from `frontend` writes hashed assets into `backend/priv/static/assets`; Phoenix then serves the SPA at `http://localhost:4001`.

</details>

### Checks

```sh
cd backend && mix precommit
cd ../cli && npm test
cd ../frontend && npm run typecheck && npm run test:unit && npm run build && npm run test:smoke
```

On Windows, run `backend\scripts\windows_check.cmd` and then the frontend scripts above. CI runs backend checks, the CLI, Phoenix-served browser smoke, and a `MIX_ENV=prod` smoke job.

## Desktop status flame

A native helper shows whether agents have talked to Flambé in the last 30 seconds. It uses an outlined, orange, or blue sparkling flame over one SSE connection to `/api/agent-status/stream`.

- macOS: [`macos/FlambeMenuBar`](macos/FlambeMenuBar/README.md)
- Windows: [`windows/FlambeTaskbar`](windows/FlambeTaskbar/README.md)

## Docs

| Doc | What it is |
|---|---|
| [Single Burner](single-burner/README.md) | Self-contained local app |
| [Host your own instance](docs/SELF_HOSTING.md) | Fly / Docker production |
| [CLI](cli/README.md) | Agent-facing command-line client |
| [Product principles](docs/PRODUCT_PRINCIPLES.md) | What Flambé owns vs. agent runtimes |
| [Glossary](GLOSSARY.md) | Shared product and call-stack vocabulary |
| [Docs index](docs/README.md) | ADRs, local database, release checklist |

## License

[MIT](LICENSE).
