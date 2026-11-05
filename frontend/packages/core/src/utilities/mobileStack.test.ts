import { mobileStack } from './mobileStack';
import type { ProcessedActivity } from './processTrace';

function activity(id: number, parent_id?: number, status = 'active', thread_id = 1): ProcessedActivity {
  return { id, parent_id, status: status as ProcessedActivity['status'], thread_id,
    name: `Activity ${id}`, categories: [], events: [], suspendedChildren: [] };
}

describe('mobileStack', () => {
  it('keeps ancestors before children and preserves concurrent branches once each', () => {
    const activities = { 3: activity(3, 1), 1: activity(1), 4: activity(4, 3),
      2: activity(2, 1), 5: activity(5, 1, 'complete'), 6: activity(6, undefined, 'active', 2) };
    expect(mobileStack(activities, 1).map(row => [row.activity.id, row.depth]))
      .toEqual([[1, 0], [2, 1], [3, 1], [4, 2]]);
  });
  it('shows necessary non-running ancestry but not inactive branches', () => {
    const activities = { 1: activity(1, undefined, 'suspended'), 2: activity(2, 1), 3: activity(3, 1, 'complete') };
    expect(mobileStack(activities, 1).map(row => row.activity.id)).toEqual([1, 2]);
  });
  it('does not hang or hide work with cycles, missing parents, or cross-thread ancestry', () => {
    const activities = { 1: activity(1, 2), 2: activity(2, 1), 3: activity(3, 99),
      4: activity(4, undefined, 'active', 2), 5: activity(5, 4) };
    expect(mobileStack(activities, '1').map(row => row.activity.id).sort()).toEqual([1, 2, 3, 5]);
  });
});
