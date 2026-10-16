import {
  decayTouchVelocity,
  dominantPanAxis,
  isNativeScrollTouchTarget,
  NATIVE_SCROLL_ATTR,
  panDeltaFromTouchMove,
  smoothTouchVelocity,
  touchDistance,
  touchHasMoved,
  touchInertiaIsActive,
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

  it('treats a mostly-vertical drag as movement once the hypot crosses the threshold', () => {
    expect(touchHasMoved({ clientX: 10, clientY: 10 }, { clientX: 12, clientY: 12 })).toBe(false);
    expect(touchHasMoved({ clientX: 10, clientY: 10 }, { clientX: 10, clientY: 20 })).toBe(true);
  });

  it('locks pan to the dominant axis', () => {
    expect(dominantPanAxis(
      { clientX: 0, clientY: 0 },
      { clientX: 3, clientY: 10 },
    )).toBe('y');
    expect(dominantPanAxis(
      { clientX: 0, clientY: 0 },
      { clientX: 10, clientY: 3 },
    )).toBe('x');
  });

  it('smooths sampled release velocity instead of trusting one frame', () => {
    expect(smoothTouchVelocity(0, 16, 16)).toBeCloseTo(0.35, 5);
    expect(smoothTouchVelocity(0.35, 16, 16)).toBeGreaterThan(0.35);
  });

  it('decays inertial velocity independent of frame size', () => {
    const oneLongFrame = decayTouchVelocity(1, 32);
    const twoShortFrames = decayTouchVelocity(decayTouchVelocity(1, 16), 16);
    expect(oneLongFrame).toBeCloseTo(twoShortFrames, 10);
    expect(oneLongFrame).toBeLessThan(1);
  });

  it('stops inertia once velocity is negligible', () => {
    expect(touchInertiaIsActive(0.5)).toBe(true);
    expect(touchInertiaIsActive(0.005)).toBe(false);
  });

  it('detects native-scroll regions nested under the timeline surface', () => {
    const child = {
      closest: (selector: string) => (selector === `[${NATIVE_SCROLL_ATTR}]` ? child : null),
    };
    const surface = {
      closest: () => null,
    };
    expect(isNativeScrollTouchTarget(child as unknown as EventTarget)).toBe(true);
    expect(isNativeScrollTouchTarget(surface as unknown as EventTarget)).toBe(false);
    expect(isNativeScrollTouchTarget(null)).toBe(false);
  });
});
