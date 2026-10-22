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
