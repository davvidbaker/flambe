# ADR-020: Instance-bound Flambe chat connections

## Status

Accepted

## Context

David uses hosted Flambe while developing Single Burner and wants to use Single
Burner at work. Keeping their activity data separate and knowing which instance
ChatGPT is accessing are required for that workflow. Browser labels and CLI
configuration alone do not identify the destination of ChatGPT's MCP tools.
The packaged plugin connects to the hosted server, while trace ids are local
to each database.

## Decision

Use **Cloud**, **Single Burner**, and **Development** as the default instance
names. Each chat connection targets one instance. On first use and an explicit
switch, the chat discovers that connection's instance identity and traces with
`flambe_traces`. It retains the connection, instance id, and trace together.

All other MCP tools require `expected_instance_id`. The server rejects a missing
or mismatched id before executing the activity command, including status reads.
All tool results and errors expose the instance in model-visible text and
structured content. An unavailable instance or local model review must never
cause substitution of another instance.

Single Burner exposes an authenticated MCP adapter over its existing SQLite
command engine. Its database stores a persistent UUID, excluded from history
exports. Phoenix uses its configured endpoint URL by default, with an explicit
`FLAMBE_INSTANCE_ID` available for deployment identity and `FLAMBE_INSTANCE_NAME`
for its label. Independent Phoenix deployments sharing a URL must configure
distinct ids.

Use the official TypeScript MCP SDK and Node adapter for Single Burner's
transport. Phoenix remains on ExMCP. The backend owns the tool definitions;
Single Burner ships an exported schema snapshot, checked against the backend
by a contract test.

## Rationale

The destination must be available to the model and checked by the server.
Labels and workflow instructions help the model choose a connection, while
the expected id prevents a retained local activity or trace id from being used
on a different connection. Reusing the existing command engines preserves
activity behavior across REST, CLI, and chat. Libraries handle protocol
negotiation rather than introducing another handwritten MCP transport.

## Consequences

MCP clients must refresh tool discovery and pass the new required argument.
The CLI REST contract is unchanged. Existing SQLite databases gain a small
settings table without changing history. No data is synchronized or migrated
between instances. ChatGPT access to loopback still needs a separately
configured private bridge; adding the endpoint does not establish that connection.

## Temporary ChatGPT plugin decision — 2026-10-22

David's preferred experience is **one Flambe plugin** that can select Cloud or
Single Burner explicitly in chat while keeping their data separate. A connection
targeting one instance does not require a separate user-facing plugin forever.

For now, David accepted a separate private **Single Burner** plugin in ChatGPT,
alongside the existing hosted plugin. This is the verified working setup:
ChatGPT reaches the local MCP endpoint through Secure MCP Tunnel, and a
read-only `flambe_traces` call returned the same instance id as the local SQLite
database. The local endpoint, persistent identity, and instance checks remain
useful if the connections are later grouped under one plugin.

We deferred the unified plugin because grouping the two registered connections
under one personal plugin has **not been validated**. This is an unresolved
integration question, not a demonstrated ChatGPT limitation. The documented
[public submission restriction](https://developers.openai.com/plugins/deploy/submission#connect-and-scan-your-mcp-server)
of one connected MCP server per plugin does not establish the same restriction
for personal/local plugin packaging. Do not cite it as proof that the preferred
design is impossible.

We also considered a single routing endpoint. A router on the Mac would make
Cloud access through that plugin depend on the Mac and tunnel being available.
A hosted Flambe router would put Single Burner requests and responses through
Flambe's hosted service. David found those tradeoffs undesirable and chose the
working separate plugin rather than pursuing either router now.

### Operating boundaries and follow-up

- The separate plugin is a temporary integration choice, not a second local
  database or a synchronization path. Local activity data remains in SQLite;
  requested tool inputs/results pass through OpenAI for ChatGPT interactions.
- The local server and tunnel client must stay running. Automatic startup and
  persistent runtime-key storage are not configured in the verified setup.
- Verify the intended ChatGPT account/workspace and Platform organization
  before creating a tunnel or runtime key. The initial setup failed because
  the browser used different personal accounts for ChatGPT and Platform.
- The runtime key needs Tunnels Read + Use. The local bridge supplies the
  Single Burner bearer token; neither secret belongs in plugin files or git.
- Revisit one-plugin packaging by testing both registered connections in the
  intended ChatGPT host, including destination selection and an unavailable
  local instance. Keep this follow-up parked until requested. Do not silently
  substitute Cloud when Single Burner is unavailable.

Optional AI review was subsequently added in [ADR-021](ADR-021-optional-single-burner-ai-reducer.md).
The verified tunnel setup above originally ran with review off; enabling a
provider is a separate local server configuration choice.
