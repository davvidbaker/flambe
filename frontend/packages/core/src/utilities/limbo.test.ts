import { hexHalfWidth, hexPlacements, limboItems } from './limbo';
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

  it('puts the heaviest item in the middle', () => {
    const placed = hexPlacements(limboItems({
      a: activity({ id: 1, status: 'unstarted', weight: 1, name: 'A' }),
      b: activity({ id: 2, status: 'unstarted', weight: 9, name: 'B' }),
      c: activity({ id: 3, status: 'unstarted', weight: 3, name: 'C' }),
    }));
    expect(placed[0]).toMatchObject({ id: '2', x: 0, y: 0 });
  });

  it('never overlaps two hexes', () => {
    const placed = hexPlacements(limboItems(Object.fromEntries(
      Array.from({ length: 19 }, (_, index) => [
        String(index),
        activity({ id: index, status: 'unstarted', weight: (index % 6) + 1, name: `Idea ${index}` }),
      ]),
    )));
    for (const left of placed) {
      for (const right of placed) {
        if (left === right) continue;
        const distance = Math.hypot(left.x - right.x, left.y - right.y);
        expect(distance).toBeGreaterThanOrEqual(hexHalfWidth(left.radius) + hexHalfWidth(right.radius));
      }
    }
  });
});
