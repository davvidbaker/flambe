import { MAX_TIME_INTO_FUTURE } from '../constants/defaultParameters';
import type { TimeRange } from './zoom';

export type PannedTimeline = TimeRange & {
  topOffset: number;
};

function pan(
  deltaX: number,
  deltaY: number,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  width: number,
  topOffset: number,
  nowTime: number,
  minTime: number,
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
    topOffset: Math.max(topOffset + deltaY, 0),
  };
}

export default pan;
