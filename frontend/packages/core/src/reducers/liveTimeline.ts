import { TIMELINE_EVENT_RECEIVED } from '../constants/liveEvents';
import type { EntityId } from '../types/ids';
import type { TraceEvent } from '../types/TraceEvent';
import processTrace from '../utilities/processTrace';
import baseTimeline, { type TimelineState } from './timeline';

interface LiveTimelineEventAction {
  event?: TraceEvent;
  trace_id?: EntityId;
  type: string;
}

export function upsertTraceEvent(events: TraceEvent[], incoming: TraceEvent): TraceEvent[] {
  const incomingId = String(incoming.id);
  const index = events.findIndex(event => String(event.id) === incomingId);

  if (index === -1) return [...events, incoming];

  const nextEvents = [...events];
  nextEvents[index] = incoming;
  return nextEvents;
}

export default function liveTimeline(
  state: TimelineState | undefined,
  action: LiveTimelineEventAction,
): TimelineState {
  const nextState = baseTimeline(
    state,
    action as Parameters<typeof baseTimeline>[1],
  );

  if (action.type !== TIMELINE_EVENT_RECEIVED || !action.event) return nextState;
  if (String(nextState.trace?.id) !== String(action.trace_id)) return nextState;

  const events = upsertTraceEvent(nextState.events, action.event);
  const processed = processTrace(events, Object.values(nextState.threads));

  return {
    ...nextState,
    activities: processed.activities,
    blocks: processed.blocks,
    events: processed.events,
    lastCategory_id: processed.lastCategory_id ?? null,
    lastThread_id: processed.lastThread_id ?? null,
    maxTime: processed.max,
    minTime: processed.min - 1000 * 60 * 10,
    threadLevels: processed.threadLevels,
    threads: processed.threads,
  };
}
