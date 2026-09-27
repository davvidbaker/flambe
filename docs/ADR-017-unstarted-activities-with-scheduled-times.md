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

- Both empty: the activity is in limbo. It belongs to a thread and is listed.
  It is not a flame.
- Either one set: a scheduled activity, drawn on that thread at that time.
  That drawing is not a lived block. David rejected "ghost" as the name for it.
  End only is drawn as a point at the end. Start only fills from the start to
  the right edge of the chart. Both is drawn as a span. An edit that puts the
  end before the start is rejected, and the activity keeps its old times.
- An activity is also in limbo while it is suspended.
- Beginning the activity writes a real begin event. That is when it becomes a
  normal activity.
- A scheduled time that has passed changes nothing. The activity stays drawn
  at its planned time and does not become active, complete, or fall into
  limbo. Beginning it later writes a begin at now; the planned time stays.
  Clearing both times puts it in limbo.
- An activity cannot begin while its parent is unstarted. The begin is refused
  until the parent is begun. David chose this over beginning the parent
  automatically, even though the reducer does resume a suspended ancestor
  before nesting under it.
- Agents may create unstarted activities, both in limbo and scheduled. David
  chose this over human-only creation, and over letting agents use limbo but
  not the schedule.
- Whoever begins an unstarted activity becomes its actor. Whoever created it
  is kept separately, as who proposed it. David chose this over dropping the
  creator, and over keeping the creator as the actor.
- Agent status leaves out unstarted activities unless the agent asks for them.
  David chose this over always hiding them and over always listing them.
- When an agent finishes its work, it checks limbo and scheduled activities
  for anything worth doing next. It proposes a candidate to the reducer with
  `flambe message` and begins it only if the reply says continue. David chose
  this over the agent beginning it unasked, and over asking him in chat.
- Limbo lives in a bottom pane under the chart that lists both unstarted
  activities with no time and currently suspended ones. David chose this over
  a drawer opened on demand, and over per-thread rows in the chart. A
  suspended activity appears both in the pane and on the chart.
- The pane is visual, like the 2018 hex field or something equally striking,
  not a plain list. The 2018 field sometimes hung the page; the new one must
  not. The 2018 code (`ec8ad9a`) ran a synchronous per-hex point-charge
  simulation on every draw, divided by distance squared with no zero guard,
  and restarted a hover transition forever.
- In the field, an item's size comes from its `weight`. Items without a weight
  sit in a side list until one is set. David chose this over sizing by time in
  limbo, and over giving every item the same size.
- Giving up on an unstarted activity deletes it. No record remains. David
  chose this over recording it as dropped (an end with no begin), and over
  leaving it in limbo forever.
- Deleting an unstarted activity keeps its children and moves them up to its
  parent, or to the thread root if it had none. David chose this over
  deleting the children too, and over refusing the delete.
- The reducer places a new unstarted activity with no parent, choosing its
  thread and categories as it does for any new top-level activity. David
  chose this over making the creator name the thread, and over using the
  creator's current thread.
- A start whose name matches an activity in limbo is treated by the reducer as
  beginning that activity, the same way it reuses matching open work. David
  chose this over creating a separate activity, with or without a notice.
- The chart can pan and zoom into the future without limit. Today it stops 10
  minutes past now (`MAX_TIME_INTO_FUTURE`). David chose this over a limit
  that stretches to the furthest scheduled activity, and over keeping the
  limit with far-off plans shown only in a list.
- A scheduled activity can be created on the chart or through a command or
  form. On the chart, a double-click on empty space on a thread makes a
  start-only one; David chose double over triple. Its edges are then dragged
  with the existing block edge-resize, which on a scheduled activity edits the
  scheduled times, not lifecycle events. David chose this over a new
  drag-to-draw gesture, which would have competed with drag-to-pan. A
  start-only activity gets an end handle at the right edge of the chart;
  dragging it back sets the end. David chose this over a second double-click,
  and over the form alone.
- An activity in limbo can be scheduled by dragging it from the pane onto a
  thread, which makes it start-only at that time, or by setting its times in
  the form.

No new lifecycle phase. Limbo is not one: it is the untimed case, or the
existing suspended phase.

## Rationale

David proposed `scheduled_start` and `scheduled_end`. He also considered making
these normal activities. He accepted the scheduled-field approach.

The reason established in the conversation: a future begin would already be
active, and a future begin plus end would already be complete, because those
phases set status without consulting the clock. An activity with no events
does not appear in the trace, so a normal activity cannot sit with no time
either.

David later rejected "ghost" as a name. He said an activity is in limbo when
it has no time, or when it is currently suspended. In his words, limbo is the
place ideas, tasks, and plans go to die.

## Alternatives considered

- Normal activities whose begin and end are in the future. David suggested
  this. Not selected.
- Calling the drawn unstarted activity a ghost. Proposed in the first write of
  this ADR. David rejected the word.
- Bringing back the 2018 bottom pane of suspended activities (a weighted hex
  field, plus a list of activities with no weight). David raised it, and later
  chose to bring back a bottom pane for limbo.

## Consequences

The trace has to return activities that have no events, or untimed activities
stay invisible. The chart draws a scheduled activity from the scheduled
fields, separate from blocks built from events. Changing the plan edits those
fields and does not rewrite lifecycle history. Agent status shows these
activities only when an agent asks for them.

This puts a human plan on the shared activity without extending the lifecycle
vocabulary. David later chose to delete todos as a primitive rather than fold
them into unstarted activities.

## Follow-ups

- Persist the two optional timestamps on activities.
- Include event-less activities in the trace payload.
- Draw scheduled activities, and list activities in limbo.
- Beginning one creates a begin event.
- Once agents can ask status for unstarted activities, add the end-of-work
  check to the `flambe-cli` skill (Cursor and Codex copies).
