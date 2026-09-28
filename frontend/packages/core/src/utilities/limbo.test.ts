import { limboItems } from './limbo';
import type { ProcessedActivity } from './processTrace';

const activity = (overrides: Partial<ProcessedActivity>): ProcessedActivity => ({
  id: 1,
  name: 'Idea',
  categories: [],
  events: [],
  suspendedChildren: [],
  ...overrides,
});

describe('limboItems', () => {
  it('keeps untimed unstarted work and suspended work', () => {
    const items = limboItems({
      a: activity({ id: 1, status: 'unstarted', name: 'Untimed' }),
      b: activity({ id: 2, status: 'unstarted', scheduled_start: 10, name: 'Planned start' }),
      c: activity({ id: 3, status: 'suspended', name: 'Paused' }),
      d: activity({ id: 4, status: 'active', name: 'Now' }),
      e: activity({ id: 5, status: 'unstarted', scheduled_end: 20, name: 'Planned end' }),
    });

    expect(items.map(item => item.activity.id)).toEqual([3, 1]);
  });

  it('sorts cards by name without giving weight special treatment', () => {
    const items = limboItems({
      a: activity({ id: 1, status: 'suspended', weight: 9, name: 'Zebra' }),
      b: activity({ id: 2, status: 'unstarted', name: 'Alpha' }),
    });
    expect(items.map(item => item.activity.name)).toEqual(['Alpha', 'Zebra']);
  });
});
