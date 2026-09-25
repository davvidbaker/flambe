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
      b: activity({ id: 2, status: 'unstarted', scheduled_start: 10, name: 'Planned' }),
      c: activity({ id: 3, status: 'suspended', name: 'Paused' }),
      d: activity({ id: 4, status: 'active', name: 'Now' }),
    });

    expect(items.map(item => item.activity.id)).toEqual([3, 1]);
  });

  it('treats a missing weight as unweighted', () => {
    const [item] = limboItems({
      a: activity({ id: 1, status: 'suspended' }),
    });
    expect(item.weighted).toBe(false);
  });

  it('sorts cards by name without separating weighted work', () => {
    const items = limboItems({
      a: activity({ id: 1, status: 'suspended', weight: 9, name: 'Zebra' }),
      b: activity({ id: 2, status: 'unstarted', name: 'Alpha' }),
    });
    expect(items.map(item => item.activity.name)).toEqual(['Alpha', 'Zebra']);
  });
});
