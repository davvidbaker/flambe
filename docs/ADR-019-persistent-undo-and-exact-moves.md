# ADR-019: Persistent undo history and exact bulk moves

## Status
Accepted

## Context
The palette originally dropped the selected IDs, and bulk moves did not record
undo. Existing undo held only the most recent created activity or lifecycle event.
Moving activities can also detach or reparent children, so reversing only the
thread IDs would not restore the previous relationships.

## Decision
Keep a chronological undo history in this browser, scoped to user and trace,
including across page refreshes. David confirmed refresh persistence. Retain up
to 100 entries per scope. Bulk moves are one step; existing lifecycle entries
use the same stack. Pop an entry only after the server confirms successful undo.

The backend performs exact-set bulk moves in a transaction, retaining parent
links among selected activities and leaving unselected children on their threads.
It returns a signed restoration record containing the changed thread/parent
relationships before and after the move. Undo verifies the user, trace, and
current relationships, then restores the changed relationships atomically.
A conflicting subsequent relationship change prevents restoration.

## Rationale
Refresh persistence is the user's choice. The agent selected signed restoration
records to avoid trusting client-supplied parent relationships and to avoid a
new database table for this first expansion of undo. Conflict checks prevent
undo from overwriting subsequent thread/parent changes.

## Alternatives considered
Reissuing individual moves to the original threads was considered, but cannot
restore detached/reparented children or preserve atomicity.

## Consequences
History is specific to this browser and origin; it does not sync across devices.
Server signing-key rotation invalidates move records. The bounded history and
record format are implementation choices, not additional user requirements.
This change covers bulk moves and existing lifecycle undo. Other edits and
delete restoration still require additional inverse operations. Successful
unsupported mutations record a boundary: undo reports the unsupported operation
and does not silently undo an older command.

Compatibility: servers without the new bulk endpoint retain their existing
individual move requests, with an unsupported-undo boundary. Weighted suspension
records its event and previous weight as one step. Undo ownership is captured
before a request starts so navigation cannot put its inverse in another trace.

## Redo extension

David requested matching redo with Cmd/Ctrl+Shift+Z and isolation from the Z
zoom chord. Undo and redo stacks persist together; a successful new mutation
clears that scope's redo branch. Both directions are serialized and failed
requests leave their source stack intact.

Successful move restoration now returns the reciprocal signed record. Created
activities and lifecycle events have a reciprocal creation-history endpoint,
which restores their original IDs and fields, category links, child links, and
optional suspension weight. Phoenix uses signed server records; Single Burner
uses a persistent local HMAC key and SQLite savepoints. Older backends retain
legacy lifecycle undo without claiming redo support. General edit/delete
restoration remains outside this change.

The timeline remembers modified Z key-down events, preventing a later Z key-up
from starting zoom even when Cmd/Ctrl is released first. Plain Z chords and
native text-field undo/redo retain their existing behavior.
