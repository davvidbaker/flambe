# ADR-002: Model activity containment as a temporal forest

## Status

Accepted

## Context

Flambe records lifecycle events for activities and previously inferred flame-chart nesting from
event order. That inference does not persist the semantic answer to which activity contains
another activity.

## Decision

Activities have an optional `parent_id`. A parent and child must belong to the same
trace thread. Activities without a parent are roots, so a trace is a forest across its threads.
Lifecycle events remain the record of an activity's timing and state. Thread moves may rewrite
`parent_id` so that invariant still holds.

## Rationale

David chose a rooted temporal tree/forest as the containment model to make agent work and the
flame chart share the same structure. He explicitly did not choose a general graph for primary
containment because multiple parents make a flame-chart position ambiguous.

## Alternatives considered

- Continue inferring nesting solely from event order.
- Use a general graph/DAG for containment.

## Consequences

Parentage is durable and can drive rendering and agent-facing status. Existing activities remain
roots. Dependency or relationship edges are deferred and must not determine containment.

Moving an activity to another thread in the same trace cascades `thread_id` to its descendant
subtree so parent and child stay on one thread. A move may take only a subset of direct
children (each selected child brings its subtree). Left-behind children stay on the source
thread and are reparented to the nearest ancestor that also stayed on that thread (the moved
activity's parent, walking up if needed). If no such ancestor exists, they become roots.
Parent links *inside* the moved subtree are unchanged. If the moved root had a parent that
stays on the source thread, the moved root's `parent_id` is cleared — otherwise the forest
would violate same-thread parentage.

David chose reparent-to-remaining-ancestor over detach-to-root so leftover work keeps the
containment that is still on the thread (e.g. 325 under 321 after 322 moves away) instead of
becoming a sibling root of that ancestor.

## Follow-ups

- Derive all flame-chart depth from parentage.
- Add interval projections if lifecycle history needs more direct temporal queries.
