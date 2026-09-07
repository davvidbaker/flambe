import {
  panDeltaFromTouchMove,
  touchDistance,
  touchMidpoint,
  wheelDeltaFromPinchScale,
} from './timelineTouch';

describe('timelineTouch', () => {
  it('measures distance and midpoint between touches', () => {
    expect(touchDistance({ clientX: 0, clientY: 0 }, { clientX: 3, clientY: 4 })).toBe(5);
    expect(touchMidpoint({ clientX: 0, clientY: 10 }, { clientX: 10, clientY: 20 })).toEqual({
      clientX: 5,
      clientY: 15,
    });
  });

  it('maps pinch-out to a negative wheel delta (zoom in)', () => {
    const deltaY = wheelDeltaFromPinchScale(1.1);
    expect(deltaY).toBeLessThan(0);
    expect(deltaY).toBeCloseTo(-120, 5);
  });

  it('maps pinch-in to a positive wheel delta (zoom out)', () => {
    expect(wheelDeltaFromPinchScale(1 / 1.1)).toBeCloseTo(120, 5);
  });

  it('scrubs earlier when the finger moves right', () => {
    expect(panDeltaFromTouchMove(100, 140)).toBe(-40);
  });
});
