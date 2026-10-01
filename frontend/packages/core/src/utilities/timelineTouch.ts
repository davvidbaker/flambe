/** Pixel movement before a one-finger touch becomes a scrub (vs a tap). */
export const TOUCH_PAN_THRESHOLD_PX = 8;

/** Mark regions nested under the timeline surface that keep native scrolling. */
export const NATIVE_SCROLL_ATTR = 'data-native-scroll';

export type TouchPoint = {
  clientX: number;
  clientY: number;
};

export type PanAxis = 'x' | 'y';

/**
 * Limbo (and similar) live inside the timeline surface. Touches that start there
 * must not enter chart pan/pinch, or preventDefault kills their overflow scroll.
 */
export function isNativeScrollTouchTarget(
  target: EventTarget | null | undefined,
): boolean {
  if (!target || typeof (target as Element).closest !== 'function') return false;
  return Boolean((target as Element).closest(`[${NATIVE_SCROLL_ATTR}]`));
}

/** Lock one-finger pan to the dominant axis once the drag threshold is crossed. */
export function dominantPanAxis(
  start: TouchPoint,
  current: TouchPoint,
): PanAxis {
  const dx = Math.abs(current.clientX - start.clientX);
  const dy = Math.abs(current.clientY - start.clientY);
  return dx >= dy ? 'x' : 'y';
}

export function touchDistance(a: TouchPoint, b: TouchPoint): number {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

export function touchHasMoved(
  start: TouchPoint,
  current: TouchPoint,
  thresholdPx: number = TOUCH_PAN_THRESHOLD_PX,
): boolean {
  return touchDistance(start, current) >= thresholdPx;
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

/** Finger drag right/down should reveal earlier times / lower threads (content follows). */
export function panDeltaFromTouchMove(previous: number, current: number): number {
  return previous - current;
}
