# @davvidbaker/flambe-cli

Zero-dependency Node 22 CLI that streams coding-agent work into a Flambe trace.

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
   Optional: `FLAMBE_THREAD` is sent on `start` when `--thread` is omitted.
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
FLAMBE_URL=https://flambe.fly.dev
FLAMBE_API_TOKEN=flb_...
FLAMBE_TRACE_ID=1
# FLAMBE_THREAD=1
```

Mint a token in Flambe Settings → API tokens. See the [repository README](https://github.com/davvidbaker/flambe#coding-agent-cli) for commands (`start`, `end`, `message`, `observe`, local `serve`).
