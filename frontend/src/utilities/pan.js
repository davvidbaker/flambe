// @flow
import { MAX_TIME_INTO_FUTURE } from 'constants/defaultParameters';

function pan(
  deltaX: number,
  deltaY: number,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  width: number,
  topOffset: number,
  nowTime: number,
  minTime: number
) {
  const widthTime = rightBoundaryTime - leftBoundaryTime;

  // let newLeftBoundaryTime = leftBoundaryTime + deltaX * (widthTime / width);
  let newRightBoundaryTime = rightBoundaryTime + deltaX * (widthTime / width);

  // right Boundary Time maxes out at 10 minutes from now
  // todo make that 10 minutes number configurable
  newRightBoundaryTime = Math.min(
    newRightBoundaryTime,
    nowTime + MAX_TIME_INTO_FUTURE
  );

  let newLeftBoundaryTime = newRightBoundaryTime - widthTime;

  if (newLeftBoundaryTime < minTime) {
    newLeftBoundaryTime = minTime;
    newRightBoundaryTime = minTime + widthTime;
  }

  let newTopOffset = topOffset + deltaY;
  newTopOffset = Math.max(newTopOffset, 0);

  return {
    leftBoundaryTime: newLeftBoundaryTime,
    rightBoundaryTime: newRightBoundaryTime,
    topOffset: newTopOffset
  };
}

export default pan;
