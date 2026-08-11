import { MAX_TIME_INTO_FUTURE } from '../constants/defaultParameters';

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
  const zoomPower = 1.1;
  const mouseWheelZoomSpeed = 1 / 120;
  const zoomFactor = zoomPower ** (deltaY * mouseWheelZoomSpeed);

  const newLeftBoundaryTime = Math.max(
    zoomCenterTime + (leftBoundaryTime - zoomCenterTime) * zoomFactor,
    minTime,
  );
  const newRightBoundaryTime = Math.min(
    zoomCenterTime + (rightBoundaryTime - zoomCenterTime) * zoomFactor,
    nowTime + MAX_TIME_INTO_FUTURE,
  );

  return { leftBoundaryTime: newLeftBoundaryTime, rightBoundaryTime: newRightBoundaryTime };
}

export default zoom;
