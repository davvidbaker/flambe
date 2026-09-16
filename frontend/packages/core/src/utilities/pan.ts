import { MAX_TIME_INTO_FUTURE } from '../constants/defaultParameters';
import type { TimeRange } from './zoom';

export type PannedTimeline = TimeRange & {
  topOffset: number;
};

/** Keep the flame-chart vertical scroll between 0 and the overflow height. */
export function clampTopOffset(topOffset: number, maxTopOffset: number): number {
  const max = Number.isFinite(maxTopOffset)
    ? Math.max(0, maxTopOffset)
    : Number.POSITIVE_INFINITY;
  const next = Number.isFinite(topOffset) ? topOffset : 0;
  return Math.min(Math.max(0, next), max);
}

function pan(
  deltaX: number,
  deltaY: number,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  width: number,
  topOffset: number,
  nowTime: number,
  minTime: number,
  maxTopOffset: number = Number.POSITIVE_INFINITY,
): PannedTimeline {
  const widthTime = rightBoundaryTime - leftBoundaryTime;
  let newRightBoundaryTime = rightBoundaryTime + deltaX * (widthTime / width);
  newRightBoundaryTime = Math.min(newRightBoundaryTime, nowTime + MAX_TIME_INTO_FUTURE);

  let newLeftBoundaryTime = newRightBoundaryTime - widthTime;
  if (newLeftBoundaryTime < minTime) {
    newLeftBoundaryTime = minTime;
    newRightBoundaryTime = minTime + widthTime;
  }

  return {
    leftBoundaryTime: newLeftBoundaryTime,
    rightBoundaryTime: newRightBoundaryTime,
    topOffset: clampTopOffset(topOffset + deltaY, maxTopOffset),
  };
}

export default pan;
