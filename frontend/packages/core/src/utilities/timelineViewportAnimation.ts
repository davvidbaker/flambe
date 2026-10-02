import type { BezierNode, PresetZoomCurve } from './presetZoomSettings';

export interface TimelineTimeRange {
  leftBoundaryTime: number;
  rightBoundaryTime: number;
}

export function easeOutCubic(progress: number): number {
  const clamped = Math.max(0, Math.min(1, progress));
  return 1 - ((1 - clamped) ** 3);
}

/** Return a CSS-compatible cubic-bezier easing function. */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (progress: number) => number {
  const sample = (t: number, a1: number, a2: number) => (
    ((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t + 3 * a1
  ) * t;
  const slope = (t: number) => (
    3 * (1 - 3 * x2 + 3 * x1) * t * t
    + 2 * (3 * x2 - 6 * x1) * t
    + 3 * x1
  );

  return (progress: number) => {
    const x = Math.max(0, Math.min(1, progress));
    if (x === 0 || x === 1) return x;

    let t = x;
    for (let iteration = 0; iteration < 8; iteration += 1) {
      const error = sample(t, x1, x2) - x;
      const currentSlope = slope(t);
      if (Math.abs(error) < 1e-7 || Math.abs(currentSlope) < 1e-7) break;
      t -= error / currentSlope;
    }

    // Newton iteration can leave the valid curve for extreme control points.
    if (t < 0 || t > 1) {
      let lower = 0;
      let upper = 1;
      t = x;
      for (let iteration = 0; iteration < 12; iteration += 1) {
        if (sample(t, x1, x2) < x) lower = t;
        else upper = t;
        t = (lower + upper) / 2;
      }
    }

    return sample(t, y1, y2);
  };
}

const cubicCoordinate = (t: number, start: number, control1: number, control2: number, end: number) => {
  const inverse = 1 - t;
  return inverse ** 3 * start
    + 3 * inverse ** 2 * t * control1
    + 3 * inverse * t ** 2 * control2
    + t ** 3 * end;
};

function segmentProgress(left: BezierNode, right: BezierNode, x: number): number {
  let lower = 0;
  let upper = 1;
  for (let iteration = 0; iteration < 18; iteration += 1) {
    const middle = (lower + upper) / 2;
    if (cubicCoordinate(middle, left.x, left.outX, right.inX, right.x) < x) lower = middle;
    else upper = middle;
  }
  return (lower + upper) / 2;
}

export function piecewiseBezier(curve: PresetZoomCurve): (progress: number) => number {
  return (progress: number) => {
    const x = Math.max(0, Math.min(1, progress));
    if (x === 0 || x === 1) return x;
    const rightIndex = curve.findIndex(node => node.x >= x);
    const index = Math.max(0, rightIndex - 1);
    const left = curve[index]!;
    const right = curve[Math.min(index + 1, curve.length - 1)]!;
    const t = segmentProgress(left, right, x);
    return cubicCoordinate(t, left.y, left.outY, right.inY, right.y);
  };
}

/**
 * Move the viewport center linearly while interpolating its span exponentially.
 * The latter makes large preset zooms feel like a camera move instead of a
 * rectangle whose edges happen to slide at the same speed.
 */
export function interpolateTimelineTimeRange(
  from: TimelineTimeRange,
  to: TimelineTimeRange,
  progress: number,
  panEasing: (progress: number) => number = easeOutCubic,
  zoomEasing: (progress: number) => number = panEasing,
): TimelineTimeRange {
  const panProgress = panEasing(progress);
  const zoomProgress = zoomEasing(progress);
  const fromCenter = (from.leftBoundaryTime + from.rightBoundaryTime) / 2;
  const toCenter = (to.leftBoundaryTime + to.rightBoundaryTime) / 2;
  const fromSpan = Math.max(1, from.rightBoundaryTime - from.leftBoundaryTime);
  const toSpan = Math.max(1, to.rightBoundaryTime - to.leftBoundaryTime);
  const center = fromCenter + (toCenter - fromCenter) * panProgress;
  const span = fromSpan * ((toSpan / fromSpan) ** zoomProgress);

  return {
    leftBoundaryTime: center - span / 2,
    rightBoundaryTime: center + span / 2,
  };
}

export function prefersReducedTimelineMotion(
  matchMedia: typeof window.matchMedia | undefined =
    typeof window === 'undefined' ? undefined : window.matchMedia?.bind(window),
): boolean {
  if (!matchMedia) return false;
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
