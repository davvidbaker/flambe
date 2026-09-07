# ADR-007: Private Fly instance with invite-code signup

## Status

Accepted

## Context

Flambe is ready as a local Phoenix 1.8 + Vite app, but it has no deploy artifact and open
registration. David wants a private hosted instance for a few people, not a public SaaS.

## Decision

Host one Flambe instance on Fly.io as a single Machine with Fly Postgres.

- Signup stays on `/register` but requires a shared invite code from `FLAMBE_INVITE_CODE`.
- Production tokens are created and revoked over authenticated HTTP (and Settings UI). Mix
  remains a local convenience only.
- Agent presence stays in-memory. Machine count is 1 so that signal stays truthful.

## Rationale

David chose Fly.io as the host and an invite code as the signup gate. Mix is not available in a
typical OTP release, so tokens cannot stay Mix-only in production. Scaling past one Machine was
not selected; in-memory presence is therefore acceptable.

## Alternatives considered

- Render, Railway, or a VPS. Not selected.
- Disable `/register` entirely and create users only with a server command. Not selected.
- Email allowlist. Not selected.

## Consequences

The public internet can reach login and registration, but registration is useless without the
invite secret. HTTPS, DB SSL, and a DB-backed health check are required on Fly. A second Machine
would break agent-presence counts until presence is moved out of memory. Email, password reset,
and custom domains are out of scope. The CLI is published to npm as
`@davvidbaker/flambe-cli` so other repos (including Cursor Cloud) can install it.

## Follow-ups

- Deploy after MIX_ENV=prod CI is green. A push to `main` runs `fly deploy`
  from GitHub Actions when that workflow succeeds.
- Custom domain later if needed; `*.fly.dev` is enough for this instance.
