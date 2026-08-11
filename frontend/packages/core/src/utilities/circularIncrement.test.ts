import circularIncrement from './circularIncrement';

describe('circularIncrement', () => {
  it('wraps forward from the final item to the first', () => {
    expect(circularIncrement(1, 2, 3)).toBe(0);
  });

  it('wraps backward from the first item to the final', () => {
    expect(circularIncrement(-1, 0, 3)).toBe(2);
  });
});
