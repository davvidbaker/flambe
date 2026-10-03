# Flambe plugin

This folder packages Flambe as an Agent Plugin for ChatGPT and Codex.

It combines:

- `skills/flambe/SKILL.md`: the call-stack workflow from the repo's `flambe-cli` skill, adapted to call MCP tools directly.
- `mcp.json`: the portable Agent Plugins MCP connection to `https://flambe.fly.dev/mcp`.
- `.codex-plugin/plugin.json` and `.mcp.json`: compatibility files for Codex/local plugin loading.

The MCP server is implemented by the main Flambe Phoenix backend. It exposes:

- `flambe_traces`
- `flambe_start`
- `flambe_end`
- `flambe_suspend`
- `flambe_resume`
- `flambe_status`
- `flambe_plan`
- `flambe_message`

## ChatGPT

The hosted MCP endpoint uses OAuth 2.1 authorization-code + PKCE for ChatGPT. The authorization flow signs into the normal Flambe account and mints a revocable Flambe API token after approval.

For development testing:

1. Deploy the branch so `https://flambe.fly.dev/mcp` and the OAuth metadata endpoints are current.
2. In ChatGPT, enable Developer mode under Settings → Security and login.
3. Go to ChatGPT Plugins and add an MCP connection for `https://flambe.fly.dev/mcp`.
4. Complete the Flambe sign-in/consent flow.
5. Package or register this plugin folder as a personal plugin so the bundled skill is loaded alongside the MCP connection.

For a public plugin, upload this folder as the plugin package and use the same remote MCP endpoint during submission.

## Codex / hosted agent environments

The compatibility `.mcp.json` reads the bearer token from `FLAMBE_API_TOKEN`; keep that secret out of the plugin files:

```sh
export FLAMBE_API_TOKEN=flb_...
```

The portable package itself contains no credentials.

## Design rule

The skill owns *when and why* to log work. The MCP server owns live state, authentication, reducer decisions, and mutations. Do not duplicate reducer placement logic in the skill.
