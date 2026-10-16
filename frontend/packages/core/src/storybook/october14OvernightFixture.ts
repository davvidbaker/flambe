import capture from './october14OvernightCapture.json';
import type { Activity } from '../types/Activity';
import type { EventPhase } from '../types/TraceEvent';
import type { AppChartFixture } from './fixtureTrace';

// Real trace capture: Oct 14, 2026, 18:00 through Oct 15, 09:00 America/Denver.
// Preserve source order, IDs, messages, hierarchy, and actor identity. No inferred
// closes or attention shifts: this is a reproduction for refining chart behavior.
export function createOctober14OvernightFixture(): AppChartFixture {
  const activities: Record<string, Activity> = Object.fromEntries(
    Object.entries(structuredClone(capture.activities)).map(([id, activity]) => [id, {
      ...activity,
      thread: capture.threads.find(thread => thread.id === activity.thread.id)!,
    }]),
  );
  return {
    traceId: capture.source.traceId,
    traceName: 'October 14–15 overnight capture',
    threads: structuredClone(capture.threads),
    categories: structuredClone(capture.categories),
    attentionShifts: [],
    events: capture.events.map(event => ({
      id: event.id,
      timestamp: Date.parse(event.timestamp),
      phase: event.phase as EventPhase,
      message: event.message ?? undefined,
      activity: activities[String(event.activityId)],
    })),
  };
}

// Explicit offsets keep the captured window stable across machines and dates.
export const october14OvernightViewport = {
  leftBoundaryTime: Date.parse('2026-10-14T21:55:00-06:00'),
  rightBoundaryTime: Date.parse('2026-10-15T00:10:00-06:00'),
};
