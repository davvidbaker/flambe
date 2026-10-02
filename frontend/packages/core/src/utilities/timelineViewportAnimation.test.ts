import { describe, expect, it, vi } from 'vitest';
import {
  cubicBezier,
  easeOutCubic,
  interpolateTimelineTimeRange,
  prefersReducedTimelineMotion,
  piecewiseBezier,
} from './timelineViewportAnimation';
import { DEFAULT_PRESET_ZOOM_CURVE } from './presetZoomSettings';

describe('timeline viewport animation', () => {
  it('preserves the exact endpoints', () => {
    const from = { leftBoundaryTime: 0, rightBoundaryTime: 1_000 };
    const to = { leftBoundaryTime: 2_000, rightBoundaryTime: 2_100 };

    expect(interpolateTimelineTimeRange(from, to, 0)).toEqual(from);
    expect(interpolateTimelineTimeRange(from, to, 1)).toEqual(to);
  });

  it('eases the center and scales the span exponentially', () => {
    const halfway = interpolateTimelineTimeRange(
      { leftBoundaryTime: 0, rightBoundaryTime: 1_000 },
      { leftBoundaryTime: 1_900, rightBoundaryTime: 2_100 },
      0.5,
    );
    const eased = easeOutCubic(0.5);
    const expectedCenter = 500 + (2_000 - 500) * eased;
    const expectedSpan = 1_000 * ((200 / 1_000) ** eased);

    expect((halfway.leftBoundaryTime + halfway.rightBoundaryTime) / 2)
      .toBeCloseTo(expectedCenter);
    expect(halfway.rightBoundaryTime - halfway.leftBoundaryTime)
      .toBeCloseTo(expectedSpan);
  });

  it('eases pan and zoom independently over the same progress', () => {
    const from = { leftBoundaryTime: 0, rightBoundaryTime: 1_000 };
    const to = { leftBoundaryTime: 1_900, rightBoundaryTime: 2_100 };
    const frame = interpolateTimelineTimeRange(
      from,
      to,
      0.5,
      progress => progress,
      () => 0,
    );

    expect((frame.leftBoundaryTime + frame.rightBoundaryTime) / 2).toBe(1_250);
    expect(frame.rightBoundaryTime - frame.leftBoundaryTime).toBe(1_000);
  });

  it('supports CSS-style cubic-bezier curve tuning', () => {
    const easing = cubicBezier(0.22, 1, 0.36, 1);

    expect(easing(0)).toBe(0);
    expect(easing(1)).toBe(1);
    expect(easing(0.25)).toBeGreaterThan(0.5);
    expect(easing(0.5)).toBeGreaterThan(easing(0.25));
  });

  it('evaluates connected cubic segments continuously', () => {
    const easing = piecewiseBezier(DEFAULT_PRESET_ZOOM_CURVE);

    expect(easing(0)).toBe(0);
    expect(easing(1)).toBe(1);
    expect(easing(0.51)).toBeCloseTo(easing(0.52), 1);
    expect(easing(0.53)).toBeCloseTo(easing(0.52), 1);
  });

  it('honors reduced motion and tolerates unavailable media queries', () => {
    expect(prefersReducedTimelineMotion(undefined)).toBe(false);
    expect(prefersReducedTimelineMotion(vi.fn(() => ({ matches: true })) as any)).toBe(true);
    expect(prefersReducedTimelineMotion(vi.fn(() => { throw new Error('unavailable'); }) as any))
      .toBe(false);
  });
});
