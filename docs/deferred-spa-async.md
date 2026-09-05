# Deferred: SPA effects without sagas for most work

Status: noted, not scheduled. Not an ADR. No implementation until David asks.

David asked to park this after an architecture review. The suggestion is from the agent, not an accepted decision.

Indexed from [OPEN_WORK.md](OPEN_WORK.md).

## Idea

Keep Redux for timeline state. Stop routing ordinary intent through redux-saga.

- CRUD, commander, in-memory search, and one-level undo: `await` the work in the code that intends it, then dispatch the result (thunk or a small API module). Not `useEffect` soup.
- Phoenix socket (`sagas/socket.ts`): still a long-lived process (channel, 2s refresh race, cancel on user refetch). That shape can stay a saga or an equivalent process. It is not the same as `POST /activities`.

## Why it was suggested

Most sagas here are an action bus (`ACTIVITY_CREATE_B` → fetch → `*_SUCCEEDED` → reducer), not concurrent processes. Search filters activity names in memory. The 870-line timeline reducer is the hard part; the saga hop sits in front of it.

## Out of scope

Do not treat this as a stack rewrite. Phoenix, Postgres, Channels, and the shared work model stay.
