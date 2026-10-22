# Flambe plugin — Cloud

This folder packages Flambe as an Agent Plugin for ChatGPT and Codex.

This package connects to **Cloud**. **Single Burner** and **Development** are
separate instances with separate data and connections. Selecting a trace does
not change the connected instance.

Every chat first calls `flambe_traces` to discover `instance.id`, `instance.name`,
and that instance's traces. Every other call includes `expected_instance_id`;
the server rejects missing or mismatched ids before accessing activity state.
Every tool result, including errors, carries `instance` in both model-visible
text and structured content. Refresh tool discovery after updating the server.
The CLI REST API is unchanged.

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

For repo-local testing:

1. Deploy the branch so `https://flambe.fly.dev/mcp` and the OAuth metadata endpoints are current.
2. Open this repository in the ChatGPT desktop app.
3. Restart the app after pulling the repo marketplace at `.agents/plugins/marketplace.json`.
4. Open the Plugins Directory, choose the **Flambé** local source, and install **Flambé — Cloud**.
5. Complete the Flambe sign-in/consent flow when prompted.

You can also register the MCP endpoint directly in ChatGPT Developer mode at `https://flambe.fly.dev/mcp`, but that tests the tools without the bundled skill. The repo marketplace tests the complete plugin.

For a public plugin, upload this folder as the plugin package and use the same remote MCP endpoint during submission.

### Single Burner and Development

Single Burner now serves the same eight MCP tools at `http://127.0.0.1:4001/mcp`,
authenticated with the local API token printed at startup. Its SQLite database
has a persistent instance id; another database gets a different id, even when
both contain trace `1`. It keeps lifecycle operations local and returns
`REDUCER_NOT_CONFIGURED` for model review.

For ChatGPT, connect that endpoint through an authenticated private MCP bridge,
such as [Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels),
and name the connection **Single Burner**. Keep the existing loopback Host header;
the local server continues to reject foreign hosts and browser Origins.
Do not point the Cloud package at a local server or expose the local token in
plugin files. Follow the same instance-selection rules with the local connection.

The Phoenix development checkout identifies itself as **Development**. Register
its `/mcp` endpoint as a separate connection using a development API token and
database. Production defaults to **Cloud**. `FLAMBE_INSTANCE_NAME` can label a
deployment, and `FLAMBE_INSTANCE_ID` can give it a stable deployment identity;
otherwise Phoenix uses its configured endpoint URL as its id. Choose a unique id
for each independently stored deployment and keep it stable across restarts.

When changing tool definitions, regenerate Single Burner's packaged schema from
the backend directory:

```sh
mix run --no-start -e 'File.write!("../cli/src/mcp-tools.json", Jason.encode_to_iodata!(FlambeNextWeb.MCPHandler.tool_definitions(), pretty: true))'
```

Backend tests verify that the packaged definitions match.

## Codex / hosted agent environments

The compatibility `.mcp.json` reads the bearer token from `FLAMBE_API_TOKEN`; keep that secret out of the plugin files:

```sh
export FLAMBE_API_TOKEN=flb_...
```

The portable package itself contains no credentials.

## Design rule

The skill owns *when and why* to log work. The MCP server owns live state, authentication, reducer decisions, and mutations. Do not duplicate reducer placement logic in the skill.
