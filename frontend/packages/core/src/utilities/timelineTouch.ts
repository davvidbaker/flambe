/** Pixel movement before a one-finger touch becomes a scrub (vs a tap). */
export const TOUCH_PAN_THRESHOLD_PX = 8;

export type TouchPoint = {
  clientX: number;
  clientY: number;
};

export function touchDistance(a: TouchPoint, b: TouchPoint): number {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

export function touchMidpoint(a: TouchPoint, b: TouchPoint): TouchPoint {
  return {
    clientX: (a.clientX + b.clientX) / 2,
    clientY: (a.clientY + b.clientY) / 2,
  };
}

/**
 * Convert a pinch scale change into the wheel `deltaY` that `zoomTimeRange` expects.
 * Fingers moving apart (scaleRatio > 1) zooms in (negative deltaY / narrower window).
 */
export function wheelDeltaFromPinchScale(scaleRatio: number): number {
  if (!(scaleRatio > 0) || !Number.isFinite(scaleRatio)) return 0;
  return (120 * Math.log(1 / scaleRatio)) / Math.log(1.1);
}

/** Finger drag right should reveal earlier times (content follows the finger). */
export function panDeltaFromTouchMove(previousX: number, currentX: number): number {
  return previousX - currentX;
}
