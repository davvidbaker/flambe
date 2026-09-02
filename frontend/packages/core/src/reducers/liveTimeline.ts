import { TIMELINE_EVENT_RECEIVED } from '../constants/liveEvents';
import type { EntityId } from '../types/ids';
import type { Thread } from '../types/Thread';
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

function mergeIncomingThread(
  threads: Record<string, Thread>,
  event: TraceEvent,
): Record<string, Thread> {
  const incomingThread = event.activity?.thread;
  if (!incomingThread?.name) return threads;

  const key = String(incomingThread.id);
  return {
    ...threads,
    [key]: {
      ...threads[key],
      ...incomingThread,
    },
  };
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
  const threads = mergeIncomingThread(nextState.threads, action.event);

  // TODO(perf): Each live event currently reprocesses the entire trace. If agent
  // telemetry becomes high-volume, update only the affected activity/block/thread
  // incrementally while preserving idempotent event upserts and reconnect resync.
  const processed = processTrace(events, Object.values(threads));

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
