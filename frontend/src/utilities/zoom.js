// @flow
import { MAX_TIME_INTO_FUTURE } from 'constants.js';

/**
 * Calculates new left and right boundaries for timeline.
 * 
 * @export
 * @param {number} deltaY - scroll amount in pixels
 * @param {number} zoomCenter - pixels
 * @param {number} leftBoundaryTime - UTC
 * @param {number} rightBoundaryTime - UTC
 * @param {number} width - in pixels of element being zoomed
 * @param {number} nowTime - current Time - UTC
 * @param {number} minTime - min time on timeline - UTC
 * @returns 
 */
function zoom(
  deltaY: number,
  zoomCenter: number,
  zoomCenterTime: number,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  width: number,
  nowTime: number,
  minTime: number
) {
  const zoomPower = 1.1;
  const mouseWheelZoomSpeed = 1 / 120;

  const zoomFactor = zoomPower ** (deltaY * mouseWheelZoomSpeed);

  let newLeft =
    zoomCenterTime + (leftBoundaryTime - zoomCenterTime) * zoomFactor;

  // can't zoom out past minimum time on timeline
  newLeft = Math.max(newLeft, minTime);

  let newRight =
    zoomCenterTime + (rightBoundaryTime - zoomCenterTime) * zoomFactor;

  // right Boundary Time maxes out at 10 minutes from now
  // todo make that 10 minutes number configurable
  newRight = Math.min(newRight, nowTime + MAX_TIME_INTO_FUTURE);

  return {
    leftBoundaryTime: newLeft,
    rightBoundaryTime: newRight,
  };
}

export default zoom;
