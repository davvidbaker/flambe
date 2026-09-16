# Docs

| Doc | What it is |
|-----|------------|
| [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) | Product boundary: Flambe owns intent/control/observability, not generic agent orchestration |
| [OPEN_WORK.md](OPEN_WORK.md) | **Start here for unfinished work** — uncommitted commit slices, carbon/Pulse follow-ups, parked ideas |
| [ADR-012-shared-agent-commands-and-mcp.md](ADR-012-shared-agent-commands-and-mcp.md) | Accepted: shared backend agent commands, MCP for hosted agents, compatible CLI, advisory next actions |
| [ADR-011-reducer-owns-the-stack.md](ADR-011-reducer-owns-the-stack.md) | Accepted: reducer is the single writer; deterministic path for lifecycle events, model for messages; reinterpret, never drop |
| [ADR-010-reducer-advises-worker-owned-stack.md](ADR-010-reducer-advises-worker-owned-stack.md) | Accepted (partly superseded by ADR-011): `flambe message` asks the reducer; CLI is the adapter; `direction` is binding |
| [ADR-009-local-node-sqlite-and-on-demand-import.md](ADR-009-local-node-sqlite-and-on-demand-import.md) | Accepted: local Node+SQLite, on-demand import to Fly |
| [deferred-spa-async.md](deferred-spa-async.md) | Parked: fewer sagas for ordinary CRUD |
| [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) | Fly / Phoenix 1.8 release |
| [LOCAL_DATABASE.md](LOCAL_DATABASE.md) | Backup / restore / test DB |
| [PHASE_0_BASELINE.md](PHASE_0_BASELINE.md) | Modernization starting point |

Other `ADR-*.md` files are accepted architecture decisions. An ADR records a
decision; it does not replace [OPEN_WORK.md](OPEN_WORK.md).
