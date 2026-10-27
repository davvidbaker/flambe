import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TimelineController, { type TimelineProps } from './TimelineController';
import { timeToPixels } from '../utilities/timelineGeometry';

beforeEach(() => {
  vi.stubGlobal('window', { localStorage: { getItem: () => null, setItem: vi.fn() } });
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 42));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

function controller() {
  const instance = new TimelineController({
    addCommand: vi.fn(), trace_id: 'composition', absoluteTimeLabels: false,
    threads: {}, minTime: 1000, maxTime: 5000,
    leftBoundaryTimeOverride: 1000, rightBoundaryTimeOverride: 5000,
  } as unknown as TimelineProps);
  instance.syncTimelineToProps(instance.props, {} as TimelineProps);
  instance.state.width = 1000;
  return instance;
}

describe('shared timeline coordination', () => {
  it('draws whichever panes are mounted against the same range through pan and zoom', () => {
    const instance = controller();
    const flame = vi.fn();
    const series = vi.fn();
    instance.subscribeDraw(flame);
    const removeSeries = instance.subscribeDraw(series);
    instance.pan(100, 0, 1000);
    instance.drawChildren();
    const afterPan = instance.getVisibleTimeRange();
    expect(afterPan.leftBoundaryTime).not.toBe(1000);
    expect(flame).toHaveBeenLastCalledWith(afterPan.leftBoundaryTime, afterPan.rightBoundaryTime);
    expect(series).toHaveBeenLastCalledWith(afterPan.leftBoundaryTime, afterPan.rightBoundaryTime);

    removeSeries();
    instance.zoom(-50, 500, 3000, 1000);
    instance.drawChildren();
    const afterZoom = instance.getVisibleTimeRange();
    expect(afterZoom).not.toEqual(afterPan);
    expect(series).toHaveBeenCalledOnce();
    expect(flame).toHaveBeenLastCalledWith(afterZoom.leftBoundaryTime, afterZoom.rightBoundaryTime);

    const remountedSeries = vi.fn();
    instance.subscribeDraw(remountedSeries);
    instance.drawChildren();
    expect(remountedSeries).toHaveBeenLastCalledWith(afterZoom.leftBoundaryTime, afterZoom.rightBoundaryTime);
  });

  it.each([false, true])('projects grid coordinates into each pane width (absolute labels: %s)', absolute => {
    const instance = controller();
    Object.assign(instance.props, { absoluteTimeLabels: absolute });
    for (const width of [320, 900]) {
      const grid = instance.calculateGridOffsets(1500, 4500, width);
      expect(grid.offsets.length).toBeGreaterThan(0);
      for (const tick of grid.offsets) {
        expect(tick.position).toBe(Math.floor(timeToPixels(tick.time, 1500, 4500, width)));
      }
    }
  });

  it('uses the event pane width and local pointer coordinate when zooming', () => {
    const instance = controller();
    const surface = { getBoundingClientRect: () => ({ left: 220, width: 400 }) };
    instance.eventSurface = vi.fn(() => surface as unknown as HTMLElement);
    instance.zoom = vi.fn();
    instance.handleWheel({ target: null, clientX: 320, deltaX: 0, deltaY: -50,
      getModifierState: () => false } as unknown as React.WheelEvent<HTMLDivElement>);
    expect(instance.zoom).toHaveBeenCalledWith(-50, 100, 2000, 400);
  });

  it('coalesces pane redraws and cancels outstanding work on unmount', () => {
    const instance = controller();
    instance.mounted = true;
    instance.subscribeDraw(vi.fn());
    instance.scheduleDrawChildren();
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    instance.componentWillUnmount();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
    expect(instance.drawListeners.size).toBe(0);
    instance.scheduleDrawChildren();
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
  });
});
