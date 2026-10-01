# Shared agent command contract

`agent-command-contract.json` is consumed by the Phoenix REST/MCP contract tests
and the CLI's local SQLite command tests. Add common behavior here when changing
commands so each implementation is checked against the same expectations.

Steps execute in order. `capture` saves an activity ID, `$activity` substitutes it
in arguments, `same_activity` checks identity preservation, `status` checks the
returned activity state, `visible: false` checks omission, and `error` checks a
normalized command error code.

The fixture covers all seven commands. Its `message` case expects an unconfigured
reducer, which local mode explicitly reports. The hosted tests additionally inject
a deterministic model response to verify successful messages through both adapters.
These are behavioral checks, not exhaustive schema or MCP conformance tests.

Run `mix test test/flambe_next_web/agent_command_contract_test.exs` from `backend/`
and `node --test test/local-commands.test.mjs` from `cli/`. Both also run in their
normal full test suites.
