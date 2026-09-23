# ADR-017: Unstarted activities carry scheduled times

## Status

Accepted

## Context

David wants work he is not starting yet. Some of it should sit on a thread at a
future time. Some of it should hang with no time. He recalled a 2018 bottom
pane of suspended activities and was unsure whether to bring it back.

A normal activity has no start or end column. The trace payload is an event
list, and the chart builds blocks from those events. A begin event marks the
activity active. An end event marks it complete. Status does not compare the
event timestamp to now.

## Decision

An activity may exist before any lifecycle event. Optional `scheduled_start`
and `scheduled_end` hold the plan:

- Both empty: limbo. The activity belongs to a thread and is listed. It is not
  a flame.
- Either one set: a ghost on that thread at that time. A ghost is not a lived
  block.
- Beginning the activity writes a real begin event. That is when it becomes a
  normal activity.

No new lifecycle phase.

## Rationale

David proposed `scheduled_start` and `scheduled_end`. He also considered making
these normal activities. He accepted the scheduled-field approach.

The reason established in the conversation: a future begin would already be
active, and a future begin plus end would already be complete, because those
phases set status without consulting the clock. An activity with no events
does not appear in the trace, so a normal activity cannot sit in limbo either.

## Alternatives considered

- Normal activities whose begin and end are in the future. David suggested
  this. Not selected.
- Bringing back the 2018 bottom pane of suspended activities (a weighted hex
  field, plus a list of activities with no weight). David raised it. It was
  not part of the decision he accepted. Whether that pane returns for
  already-suspended work is still open.

## Consequences

The trace has to return activities that have no events, or limbo items stay
invisible. The chart draws ghosts from the scheduled fields, separate from
blocks built from events. Changing the plan edits those fields and does not
rewrite lifecycle history. Agent status does not see these activities until a
begin event.

This puts a human plan on the shared activity without extending the lifecycle
vocabulary. David later chose to delete todos as a primitive rather than fold
them into unstarted activities.

## Follow-ups

- Persist the two optional timestamps on activities.
- Include event-less activities in the trace payload.
- Draw ghosts, and list activities whose scheduled times are both empty.
- Beginning one creates a begin event.
