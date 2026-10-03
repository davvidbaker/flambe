import { describe, expect, it } from 'vitest';

import { processTimelineTrace, updateActivity } from '../actions';
import timeline, { type TimelineState } from './timeline';
import type { ProcessedActivity } from '../utilities/processTrace';

function activity(fields: Partial<ProcessedActivity> & Pick<ProcessedActivity, 'id'>): ProcessedActivity {
  return {
    categories: [],
    events: [],
    suspendedChildren: [],
    thread_id: 1,
    ...fields,
  };
}

function stateWithActivity(current: ProcessedActivity): TimelineState {
  return {
    ...timeline(undefined, { type: '@@init' }),
    activities: { [String(current.id)]: current },
  };
}

describe('activity category_ids', () => {
  it('replaces assigned categories instead of appending', () => {
    const current = activity({ id: 7, categories: [1] });
    const next = timeline(stateWithActivity(current), updateActivity(7, { category_ids: [2, 3] }));
    expect(next.activities['7'].categories).toEqual([2, 3]);
  });

  it('clears categories when given an empty list', () => {
    const current = activity({ id: 7, categories: [1, 2] });
    const next = timeline(stateWithActivity(current), updateActivity(7, { category_ids: [] }));
    expect(next.activities['7'].categories).toEqual([]);
  });
});

describe('scheduled activity updates', () => {
  it('moves the rendered block immediately with its optimistic activity update', () => {
    const current = activity({ id: 7, status: 'unstarted', thread_id: 1, scheduled_start: 100, scheduled_end: 200 });
    const state = {
      ...stateWithActivity(current),
      blocks: [{ activity_id: 7, beginning: 'B' as const, events: [], level: 0, scheduled: true, startTime: 100, endTime: 200 }],
    };
    const next = timeline(state, updateActivity(7, {
      thread_id: 2,
      scheduled_start_integer: 150,
      scheduled_end_integer: 250,
    }));
    expect(next.activities['7']).toMatchObject({ thread_id: 2, scheduled_start: 150, scheduled_end: 250 });
    expect(next.blocks[0]).toMatchObject({ startTime: 150, endTime: 250 });
  });

  it('sets the end of an open scheduled block without flashing back to an open span', () => {
    const current = activity({ id: 7, status: 'unstarted', scheduled_start: 100, scheduled_end: null });
    const state = {
      ...stateWithActivity(current),
      blocks: [{ activity_id: 7, beginning: 'B' as const, events: [], level: 0, scheduled: true, startTime: 100 }],
    };
    const next = timeline(state, updateActivity(7, { scheduled_end_integer: 200 }));
    expect(next.activities['7'].scheduled_end).toBe(200);
    expect(next.blocks[0].endTime).toBe(200);
  });
});

describe('activity agent_id', () => {
  it('assigns an agent without touching other activities', () => {
    const current = activity({ id: 7, agent_id: null, agent_name: null });
    const next = timeline(stateWithActivity(current), updateActivity(7, {
      agent_id: 'cursor:steve',
      agent_name: 'Steve',
    }));
    expect(next.activities['7'].agent_id).toBe('cursor:steve');
    expect(next.activities['7'].agent_name).toBe('Steve');
  });

  it('clears agent identity back to human', () => {
    const current = activity({ id: 7, agent_id: 'cursor:steve', agent_name: 'Steve' });
    const next = timeline(stateWithActivity(current), updateActivity(7, {
      agent_id: null,
      agent_name: null,
    }));
    expect(next.activities['7'].agent_id).toBeNull();
    expect(next.activities['7'].agent_name).toBeNull();
  });

  it('writes the new agent onto nested live-event payloads', () => {
    const current = activity({ id: 7, agent_id: 'cursor:pulse', agent_name: 'pulse' });
    const state = {
      ...stateWithActivity(current),
      events: [{
        id: 10,
        phase: 'B' as const,
        timestamp: 1,
        activity: { id: 7, name: 'Work', categories: [], agent_id: 'cursor:pulse', agent_name: 'pulse' },
      }],
    };
    const next = timeline(state, updateActivity(7, {
      agent_id: 'cursor:nora',
      agent_name: 'Nora',
    }));
    expect(next.events[0].activity?.agent_id).toBe('cursor:nora');
    expect(next.events[0].activity?.agent_name).toBe('Nora');
  });

  it('keeps the server agent after ACTIVITY_UPDATE_SUCCEEDED', () => {
    const current = activity({ id: 7, agent_id: 'cursor:pulse', agent_name: 'pulse' });
    const next = timeline(stateWithActivity(current), {
      type: 'ACTIVITY_UPDATE_SUCCEEDED',
      data: { id: 7, agent_id: 'cursor:steve', agent_name: 'Steve' },
    });
    expect(next.activities['7'].agent_id).toBe('cursor:steve');
    expect(next.activities['7'].agent_name).toBe('Steve');
  });
});

describe('processTimelineTrace uses the fetched agent', () => {
  it('takes the incoming snapshot on a full trace rebuild', () => {
    const current = activity({ id: 7, agent_id: 'cursor:nora', agent_name: 'Nora' });
    const state = stateWithActivity(current);
    const next = timeline(state, processTimelineTrace(
      [{
        id: 10,
        phase: 'B',
        timestamp: 1,
        activity: {
          id: 7,
          name: 'Work',
          categories: [],
          thread: { id: 1, name: 'Main', rank: 0 },
          agent_id: 'cursor:pulse',
          agent_name: 'pulse',
        },
      }],
      [{ id: 1, name: 'Main', rank: 0 }],
    ));
    expect(next.activities['7'].agent_id).toBe('cursor:pulse');
    expect(next.activities['7'].agent_name).toBe('pulse');
  });
});
