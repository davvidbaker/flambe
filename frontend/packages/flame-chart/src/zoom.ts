export interface TimeRange {
  start: number;
  end: number;
}

export interface ZoomBounds {
  min?: number;
  max?: number;
}

/**
 * Match Flambe's timeline wheel-zoom curve while keeping the pointer's time
 * under the same relative position in the viewport.
 */
export function zoomTimeRange(
  deltaY: number,
  zoomCenterTime: number,
  start: number,
  end: number,
  { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY }: ZoomBounds = {},
): TimeRange {
  const zoomFactor = 1.1 ** (deltaY / 120);

  return {
    start: Math.max(zoomCenterTime + (start - zoomCenterTime) * zoomFactor, min),
    end: Math.min(zoomCenterTime + (end - zoomCenterTime) * zoomFactor, max),
  };
}
