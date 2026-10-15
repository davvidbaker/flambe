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

Single Burner binds loopback only. Cloud-hosted agents cannot reach it directly; use a hosted Flambé instance for agents running elsewhere.

## What is bundled

The npm package contains the built Flambé web UI. The local HTTP/SQLite engine currently comes from `@davvidbaker/flambe-cli`, so the behavior stays identical to the existing `flambe serve` path while the two distributions are separated.

`@davvidbaker/flambe-cli` remains the agent-facing command-line client. Single Burner is the runnable local app.
