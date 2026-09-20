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
});

describe('processTimelineTrace keeps assigned agents', () => {
  it('does not restore the previous agent when the trace is rebuilt', () => {
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
    expect(next.activities['7'].agent_id).toBe('cursor:nora');
    expect(next.activities['7'].agent_name).toBe('Nora');
  });
});
