import { describe, expect, it } from 'vitest';

import { TIMELINE_EVENT_RECEIVED } from '../constants/liveEvents';
import type { Activity } from '../types/Activity';
import type { Thread } from '../types/Thread';
import type { TraceEvent } from '../types/TraceEvent';
import processTrace from '../utilities/processTrace';
import liveTimeline, { upsertTraceEvent } from './liveTimeline';
import type { TimelineState } from './timeline';

const thread: Thread = { id: 3, name: 'Agent work', rank: 0 };
const activity: Activity = {
  id: 7,
  name: 'Implement streaming',
  description: 'Populate the flame chart as work happens',
  categories: [],
  thread,
};

const beginEvent: TraceEvent = {
  id: 10,
  activity,
  message: 'Starting',
  phase: 'B',
  timestamp: 1_000,
};

const endEvent: TraceEvent = {
  id: 11,
  activity,
  message: 'Done',
  phase: 'E',
  timestamp: 2_000,
};

describe('live timeline events', () => {
  it('upserts repeated socket deliveries by event id', () => {
    const updated = { ...endEvent, message: 'Actually done' };
    const events = upsertTraceEvent([beginEvent, endEvent], updated);

    expect(events).toHaveLength(2);
    expect(events[1].message).toBe('Actually done');
  });

  it('reprocesses the open trace so an ending event closes the live flame block', () => {
    const initial = liveTimeline(undefined, { type: '@@INIT' });
    const processed = processTrace([beginEvent], [thread]);
    const state: TimelineState = {
      ...initial,
      ...processed,
      trace: { id: 99, name: 'Live agent trace', filterExcludes: [] },
      lastCategory_id: processed.lastCategory_id ?? null,
      lastThread_id: processed.lastThread_id ?? null,
      minTime: processed.min - 1000 * 60 * 10,
      maxTime: processed.max,
    };

    const action = {
      type: TIMELINE_EVENT_RECEIVED,
      trace_id: 99,
      event: endEvent,
    };

    const next = liveTimeline(state, action);

    expect(next.events.map(event => event.id)).toEqual([10, 11]);
    expect(next.blocks).toHaveLength(1);
    expect(next.blocks[0].endTime).toBe(2_000);
    expect(next.blocks[0].ending).toBe('E');

    const replayed = liveTimeline(next, action);
    expect(replayed.events).toHaveLength(2);
    expect(replayed.blocks).toHaveLength(1);
  });

  it('ignores events for a trace that is not currently open', () => {
    const initial = liveTimeline(undefined, { type: '@@INIT' });
    const state: TimelineState = {
      ...initial,
      trace: { id: 99, name: 'Open trace', filterExcludes: [] },
    };

    const next = liveTimeline(state, {
      type: TIMELINE_EVENT_RECEIVED,
      trace_id: 100,
      event: beginEvent,
    });

    expect(next).toBe(state);
  });
});
