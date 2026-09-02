import { MAX_TIME_INTO_FUTURE } from '../constants/defaultParameters';
import { zoomTimeRange } from '@davvidbaker/flame-chart';

export type TimeRange = {
  leftBoundaryTime: number;
  rightBoundaryTime: number;
};

function zoom(
  deltaY: number,
  _zoomCenter: number,
  zoomCenterTime: number,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  _width: number,
  nowTime: number,
  minTime = 0,
): TimeRange {
  const range = zoomTimeRange(
    deltaY,
    zoomCenterTime,
    leftBoundaryTime,
    rightBoundaryTime,
    { min: minTime, max: nowTime + MAX_TIME_INTO_FUTURE },
  );

  return { leftBoundaryTime: range.start, rightBoundaryTime: range.end };
}

export default zoom;
