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
  _nowTime: number,
  minTime = 0,
): TimeRange {
  const range = zoomTimeRange(
    deltaY,
    zoomCenterTime,
    leftBoundaryTime,
    rightBoundaryTime,
    { min: minTime },
  );

  return { leftBoundaryTime: range.start, rightBoundaryTime: range.end };
}

export default zoom;
