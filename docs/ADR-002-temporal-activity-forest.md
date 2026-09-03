# ADR-002: Model activity containment as a temporal forest

## Status

Accepted

## Context

Flambe records lifecycle events for activities and previously inferred flame-chart nesting from
event order. That inference does not persist the semantic answer to which activity contains
another activity.

## Decision

Activities have an optional, immutable `parent_id`. A parent and child must belong to the same
trace thread. Activities without a parent are roots, so a trace is a forest across its threads.
Lifecycle events remain the record of an activity's timing and state.

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
subtree so parent and child stay on one thread; `parent_id` is unchanged.

## Follow-ups

- Derive all flame-chart depth from parentage.
- Add interval projections if lifecycle history needs more direct temporal queries.
