import { hexPlacements, limboItems } from './limbo';
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
});

describe('hexPlacements', () => {
  it('sizes hexes from weight and skips unweighted items', () => {
    const items = limboItems({
      a: activity({ id: 1, status: 'suspended', weight: 1, name: 'Small' }),
      b: activity({ id: 2, status: 'suspended', weight: 4, name: 'Large' }),
      c: activity({ id: 3, status: 'unstarted', name: 'No weight' }),
    });
    const placed = hexPlacements(items);
    expect(placed).toHaveLength(2);
    const large = placed.find(hex => hex.id === '2');
    const small = placed.find(hex => hex.id === '1');
    expect(large!.radius).toBeGreaterThan(small!.radius);
  });
});
