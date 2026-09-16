import { describe, expect, it } from 'vitest';

import { updateActivity } from '../actions';
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
