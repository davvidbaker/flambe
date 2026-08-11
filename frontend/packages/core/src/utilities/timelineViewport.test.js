// @flow

import { savedRangeIsUsable } from './timelineViewport';

describe('savedRangeIsUsable', () => {
  const dayStart = 1_000;
  const dayEnd = 2_000;
  const traceStart = 3_000;
  const traceEnd = 4_000;

  it('keeps an intentionally empty viewport for its current trace', () => {
    expect(savedRangeIsUsable(
      dayStart,
      dayEnd,
      traceStart,
      traceEnd,
      'trace-1',
      'trace-1',
    )).toBe(true);
  });

  it('rejects an empty viewport restored from another trace', () => {
    expect(savedRangeIsUsable(
      dayStart,
      dayEnd,
      traceStart,
      traceEnd,
      'trace-1',
      'trace-2',
    )).toBe(false);
  });

  it('keeps a legacy unscoped viewport only when it overlaps the trace', () => {
    expect(savedRangeIsUsable(
      2_500,
      3_500,
      traceStart,
      traceEnd,
      null,
      'trace-1',
    )).toBe(true);
  });
});
