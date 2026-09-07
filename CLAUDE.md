# Agent instructions

This repository is Flambe. Phoenix-specific rules live in `backend/AGENTS.md` and take precedence for backend work.

## Core behavior

First determine whether the task is exploratory or implementation-ready.

For ambiguous work, prefer:

**Explore → Understand → Decide → Document important decisions → Implement → Test → Review**

Treat that sequence as a reasoning/workflow heuristic, not as a flat activity plan. Actual work may branch into nested investigations, prerequisites, debugging, and verification as attention moves.

Do not rush consequential architecture or data-flow decisions into implementation. Surface decisions that require human judgment before they become buried in code.

Optimize for human cognitive load and the human feedback loop.

A primary failure mode to avoid is:

**human asks the agent to do something → agent disappears into a long batch of work → human waits → agent returns an essay**

For substantial work, surface decision-relevant findings, changed assumptions, blockers, and useful partial results at meaningful checkpoints. Keep those checkpoints concise. Do not replace one giant final dump with constant narration.

Batch work that is genuinely independent and mechanical. **Do not batch away the human feedback loop.**

When work is implementation-ready, execute without unnecessary ceremony. Prefer concise, decision-relevant artifacts over generated documentation for its own sake.

## Activity logging

For substantial or multi-step work, use the `flambe-cli` skill whenever Flambe is configured. Treat the work as a live flame-chart/call-stack: keep the active activity tree aligned with where attention actually goes, including nested prerequisites, investigations, debugging, and verification. Do not merely create one task-level activity at the outset and close it at the end.

Skip trivial one-offs and never log secrets. Let the `flambe-cli` skill own the CLI mechanics, status checks, nesting behavior, configuration handling, and offline recovery.

Flambe is configured when `FLAMBE_URL`, `FLAMBE_API_TOKEN`, and `FLAMBE_TRACE_ID` are set in the process environment or in `.env` (shell env wins). Cursor Cloud: put those in environment secrets, not in git.

If `flambe` is not on PATH, run `node cli/bin/flambe.mjs` from the repo root.

- Cursor skill: `.cursor/skills/flambe-cli`
- Codex skill: `.codex/skills/flambe-cli` (keep these two in sync)
