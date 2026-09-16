import { describe, expect, it } from 'vitest';
import pan, { clampTopOffset } from './pan';

describe('clampTopOffset', () => {
  it('pins the scroll to the overflowing content', () => {
    expect(clampTopOffset(-20, 80)).toBe(0);
    expect(clampTopOffset(40, 80)).toBe(40);
    expect(clampTopOffset(120, 80)).toBe(80);
    expect(clampTopOffset(20, 0)).toBe(0);
  });

  it('allows unbounded growth when the max is unknown', () => {
    expect(clampTopOffset(400, Number.POSITIVE_INFINITY)).toBe(400);
  });
});

describe('pan', () => {
  const now = 10_000;
  const minTime = 0;

  it('scrubs time on deltaX and vertical offset on deltaY', () => {
    const next = pan(100, 30, 0, 1000, 100, 10, now, minTime, 200);
    expect(next.leftBoundaryTime).toBe(1000);
    expect(next.rightBoundaryTime).toBe(2000);
    expect(next.topOffset).toBe(40);
  });

  it('does not scroll past the flame-chart overflow', () => {
    expect(pan(0, 50, 0, 1000, 100, 80, now, minTime, 100).topOffset).toBe(100);
    expect(pan(0, -50, 0, 1000, 100, 10, now, minTime, 100).topOffset).toBe(0);
  });
});
