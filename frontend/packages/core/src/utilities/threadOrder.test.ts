import { moveItem } from './threadOrder';

describe('moveItem', () => {
  it('moves an item to a new index', () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 2, 0)).toEqual([3, 1, 2]);
  });

  it('returns the original list when the move is a no-op', () => {
    const items = [1, 2, 3];
    expect(moveItem(items, 1, 1)).toBe(items);
    expect(moveItem(items, -1, 0)).toBe(items);
  });
});
