import zoom from './zoom';

describe('zoom function', () => {
  const zoomCenter = 500;
  const zoomCenterTime = 15e10;
  const oldLeftBoundaryTime = 10e10;
  const oldRightBoundaryTime = 20e10;
  const width = 550;

  it('should zoom in when deltaY is negative', () => {
    const deltaY = -100;
      
    const { leftBoundaryTime, rightBoundaryTime } = zoom(
      deltaY,
      zoomCenter,
      zoomCenterTime,
      oldLeftBoundaryTime,
      oldRightBoundaryTime,
      width,
      Date.now(),
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

    expect(leftBoundaryTime).toBeLessThan(oldLeftBoundaryTime);
    expect(leftBoundaryTime).toBeLessThan(rightBoundaryTime);
    expect(rightBoundaryTime).toBeGreaterThan(oldRightBoundaryTime);
    expect(rightBoundaryTime).toBeGreaterThan(leftBoundaryTime);
  });
});
