# ExMCP transport migration

This plan replaces Flambe's hand-written MCP wire adapter without changing the
shared command service or browser/CLI REST behavior.

## Invariants

- `FlambeNext.AgentCommands` remains the single application entry point for MCP
  tools.
- The authenticated Phoenix user scopes every trace and activity lookup.
- A valid `x-flambe-agent-id` resolved by the existing pipeline overrides identity
  values in tool arguments. Direct MCP callers without that header retain the
  current argument-based identity behavior.
- `/mcp`, bearer-token authentication, tool names, argument names, tool result
  content, and command error codes remain stable.
- Browser sessions do not authenticate `/mcp`; the endpoint requires a bearer API
  token.
- A failed mutation is never retried through another write path.

## Phase 1: Pin and prove the adapter

1. Add `{:ex_mcp, "~> 1.5"}` to the backend dependencies and inspect the resolved
   dependency changes.
2. Add a minimal test-only handler and mount to prove Phoenix body parsing,
   authenticated pipeline ordering, response headers, and modern discovery.
3. Run ExMCP's documented MCP `2026-07-28` conformance harness against the test
   endpoint before migrating Flambe tools.

Exit criterion: a Phoenix endpoint behind Flambe's pipeline passes the relevant
modern discovery, Streamable HTTP, and header-validation checks.

## Phase 2: Introduce the Flambe handler

1. Create `FlambeNext.MCPHandler` using the stable `ExMCP.Server.Handler` API.
2. Move tool metadata and input schemas out of `McpController`. Preserve
   deterministic tool ordering and add behavior annotations where accurate.
3. Resolve `handler_opts` from `Plug.Conn` into request-scoped state containing the
   authenticated user and resolved agent identity.
4. Extract identity precedence from `AgentCommandController` into a shared helper
   usable by both REST and MCP adapters.
5. Dispatch the seven `flambe_*` tools to `AgentCommands.execute/3` and normalize
   successful and command-error results into MCP tool results. Protocol-shape
   errors remain ExMCP's responsibility.
6. Include serialized JSON text alongside `structuredContent`. Add an
   `outputSchema` only where it accurately describes both success and tool-error
   output; do not publish a misleading schema merely to have one.

Exit criterion: handler-level tests cover every tool, identity precedence,
authorization isolation, successful structured output, and each command-error
mapping without exercising HTTP framing.

## Phase 3: Replace the route in dual-era mode

1. Add a token-only MCP authentication pipeline and replace the explicit MCP
   controller routes with a `forward` to `ExMCP.HttpPlug`.
2. Configure `protocol_mode: :prefer_modern`; keep deprecated standalone HTTP+SSE
   disabled unless a known deployed client requires it.
3. Configure production `allowed_hosts` and explicit `allowed_origins`; do not use
   `:any` in production.
4. Pass `handler_opts` from the connection and preserve agent response headers.
5. Keep the old controller available only during test development; delete it once
   transport parity tests pass so `/mcp` has one owner.

Exit criterion: both modern `2026-07-28` requests and the currently supported
legacy initialize flow can list and call tools at the same `/mcp` URL.

## Phase 4: Update compatibility callers and tests

1. Convert `mcp_controller_test.exs` from implementation-shaped assertions to
   public protocol and application-contract assertions.
2. Preserve cross-adapter coverage: start over MCP, inspect/end over REST, and
   assert the live broadcast.
3. Update the CLI's old-server `flambe_message` fallback to use a complete legacy
   initialization flow or remove that fallback once the minimum supported server
   version makes it unreachable. Do not teach the CLI a second partial MCP client.
4. Test bearer authentication, browser-session rejection, invalid tokens, foreign
   origins, invalid hosts, cross-user trace IDs, malformed tool arguments, unknown
   tools, and protocol-version mismatch.
5. Run the official MCP conformance suite and at least one official SDK client
   interoperability test against the mounted Phoenix endpoint.

Exit criterion: the application contract, security boundary, dual-era behavior,
and official protocol checks all pass.

## Phase 5: Remove custom protocol code and document operation

1. Delete `McpController` and any controller-specific protocol helpers.
2. Update README and self-hosting documentation with supported MCP revisions,
   bearer authentication, allowed-host/origin configuration, and client examples.
3. Record the exact ExMCP version and conformance harness version used for release
   verification.
4. Run `mix precommit`, CLI tests, and a production-like smoke test through the
   deployed reverse proxy.

Exit criterion: no Flambe code manually implements MCP negotiation, discovery,
transport headers, or JSON-RPC envelopes.

## Rollout and rollback

- Ship the adapter without changing `/mcp` or tool contracts.
- Verify one modern client and the Flambe CLI before broad rollout.
- Roll back by restoring the previous route/controller and dependency lockfile;
  there is no data migration.
- After observing real clients through a compatibility window, separately decide
  whether to move to modern-only mode. That is not part of this migration.

## Post-migration decisions

- How long to retain legacy protocol support after modern clients are verified.
