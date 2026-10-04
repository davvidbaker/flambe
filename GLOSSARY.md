# Flambé glossary

Flambé borrows some language from profilers and call stacks, then applies it to human and agent work. This is the shared vocabulary.

## Activity

A meaningful unit of work. Activities can be nested, so a parent goal can contain narrower subproblems.

An activity is not a log line. Shell commands, file reads, tool calls, commits, and other tiny execution details generally do not deserve their own activity.

## Active

An activity that is currently in progress.

## Agent

A human- or machine-operated actor associated with work in Flambé. Coding agents can report their own activities into the same trace as human work.

## Call stack

The mental model Flambé uses for nested work.

Starting a narrower subproblem while leaving its parent running is a **push**. Finishing that child and returning to the parent is a **pop**.

The point is to represent where attention actually went, not to manufacture a perfect hierarchy after the fact.

## Category

A label applied to activities for grouping or visual classification. Categories are independent of threads and nesting.

## Complete

An activity whose work has ended. A completed activity may have ended normally, by resolution, or by rejection.

## End

Finish an activity without adding a stronger semantic judgment such as resolved or rejected.

## Flame

The visual block representing an activity on the flame chart.

Nested flames expose the shape of attention over time: broad work on the bottom, narrower work stacked above it.

## Flame chart

The primary visualization in Flambé. Time runs horizontally and nested activities stack vertically, borrowing the visual grammar of software profilers.

Unlike a traditional profiler, the thing being profiled is work and attention.

## Limbo

Work that exists but is not currently happening.

In the current product, limbo contains:

- unstarted activities with no scheduled start or end, and
- suspended activities.

Weighted limbo items can be shown in the honeycomb view.

## Message

A semantic update sent to the Reducer Agent when judgment is needed about scope, drift, placement, or direction.

A message is not intended for routine progress narration.

## Parent

The activity directly above another activity in the work hierarchy.

A parent normally stays active while attention dives into a child.

## Parent suspended

An activity that is not independently suspended, but is effectively paused because one of its ancestors is suspended.

## Plan

Create future work without starting it. Unscheduled planned work belongs in limbo.

## Pop

Finish the current leaf activity and return attention to its parent.

## Push

Start a nested child activity while leaving the parent running.

## Reducer Agent

The agent that keeps incoming work proposals consistent with the existing Flambé state.

For agent-reported work, lifecycle calls are proposals. The reducer may correct parent or thread placement, reuse duplicates, resume ancestors, close descendants, or return guidance. Its returned state is authoritative.

## Reject / rejected

End an activity because the attempted path, premise, or piece of work was rejected rather than successfully resolved.

This is stronger than simply ending the activity.

## Resolve / resolved

End an activity with an explicit successful or explanatory resolution.

This is stronger than simply ending the activity.

## Resume

Return a suspended activity to active work.

## Root activity

A top-level activity with no parent. It represents a genuinely independent workstream rather than a subproblem of existing work.

## Scheduled activity

An unstarted activity with a scheduled start time, optionally with a scheduled end time.

Scheduled activities are distinct from unscheduled limbo work.

## Semantic work unit

The granularity Flambé tries to capture: a meaningful goal, subproblem, prerequisite, design decision, focused test effort, or verification step.

If recording it would make the flame chart more truthful and useful, it is probably a semantic work unit.

## Suspend / suspended

Pause an activity without finishing it.

Suspended activities remain unfinished and appear in limbo until resumed or ended.

## Thread

A durable workstream within a trace.

Threads separate parallel lines of work. Nesting answers “what is this activity inside of?” while threads answer “which workstream does this belong to?”

## Trace

The container for a Flambé timeline: its threads, activities, events, and history.

A trace is the broad workspace whose flame chart you are looking at.

## Weight

An optional numeric importance or magnitude attached to an activity.

In limbo, weighted activities affect the size and placement of honeycomb items.
