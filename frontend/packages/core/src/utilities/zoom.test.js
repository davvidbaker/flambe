// @flow

import zoom from './zoom';

console.table = () => {}

describe('zoom function', () => {
  const zoomCenter = 500,
  zoomCenterTime = 15e10,
  oldLeftBoundaryTime = 10e10,
  oldRightBoundaryTime = 20e10,
  width = 550;

  it('should zoom in when deltaY is negative', () => {
    const deltaY = -100;
      
    const { leftBoundaryTime, rightBoundaryTime } = zoom(
      deltaY,
      zoomCenter,
      zoomCenterTime,
      oldLeftBoundaryTime,
      oldRightBoundaryTime,
      width,
      new Date().getTime()
    );
    expect(leftBoundaryTime).toBeGreaterThan(oldLeftBoundaryTime);
    expect(rightBoundaryTime).toBeLessThan(oldRightBoundaryTime);
  });

  it('should zoom out when deltaY is positive', () => {
    const deltaY = 5000;
    
    const { leftBoundaryTime, rightBoundaryTime } = zoom(
      deltaY,
      zoomCenter,
      zoomCenterTime,
      oldLeftBoundaryTime,
      oldRightBoundaryTime,
      width,
      new Date().getTime()
    );

    console.log(`deltaY,
      zoomCenter,
      zoomCenterTime,
      oldLeftBoundaryTime,
      oldRightBoundaryTime,
      width`, deltaY,
      zoomCenter,
      zoomCenterTime,
      oldLeftBoundaryTime,
      oldRightBoundaryTime,
      width);
    expect(leftBoundaryTime).toBeLessThan(oldLeftBoundaryTime);
    expect(leftBoundaryTime).toBeLessThan(rightBoundaryTime);
    expect(rightBoundaryTime).toBeGreaterThan(oldRightBoundaryTime);
    expect(rightBoundaryTime).toBeGreaterThan(leftBoundaryTime);
  });
});
