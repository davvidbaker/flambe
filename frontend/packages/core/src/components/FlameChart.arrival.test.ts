import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlameChart } from './FlameChart';
import type { EntityId } from '../types/ids';
import type { ProcessedActivity, TraceBlock } from '../utilities/processTrace';

beforeEach(() => {
  vi.stubGlobal('window', { matchMedia: () => ({ matches: false }), removeEventListener: vi.fn() });
  vi.spyOn(performance, 'now').mockReturnValue(1000);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function block(id: EntityId, overrides: Partial<TraceBlock> = {}): TraceBlock {
  return { activity_id: id, beginning: 'B', startTime: 100, events: [], level: 0, ...overrides };
}

function activities(blocks: TraceBlock[]): Record<string, ProcessedActivity> {
  return Object.fromEntries(blocks.map(entry => [String(entry.activity_id), {
    id: entry.activity_id, name: String(entry.activity_id), thread_id: 1,
    categories: [], events: [], suspendedChildren: [],
  }]));
}

function chart(initial: TraceBlock[] = [], traceId: EntityId | null = 1) {
  const instance = new FlameChart({
    arrivalTraceId: traceId, arrivalBlocks: initial, blocks: initial,
    activities: activities(initial), threads: { 1: { id: 1, name: 'Work' } },
    categories: [], createAt: vi.fn(),
  } as never);
  instance.state = { canvasHeight: 300 };
  instance.renderActivities = activities(initial);
  instance.paintableBlocks = initial;
  instance.redrawChart = vi.fn();
  instance.redrawMeasurement = vi.fn();
  instance.prepareActivityReflow = vi.fn();
  instance.getRenderedBlockTransform = vi.fn(() => ({
    blockX: 100, blockY: 50, blockWidth: 200, blockHeight: 24,
  }));
  instance.trackActivityEntrances();
  return instance;
}

function update(instance: FlameChart, source: TraceBlock[], visible = source, traceId = instance.props.arrivalTraceId) {
  const nextActivities = activities(source);
  Object.assign(instance, {
    props: { ...instance.props, arrivalBlocks: source, arrivalTraceId: traceId, blocks: visible, activities: nextActivities },
    renderActivities: nextActivities, paintableBlocks: visible,
  });
  instance.trackActivityEntrances();
}

function context(): CanvasRenderingContext2D {
  return {
    save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), ellipse: vi.fn(),
    arc: vi.fn(), stroke: vi.fn(), fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('activity arrival lifecycle', () => {
  it('seeds the initial trace silently, including an initially empty timeline', () => {
    const initial = chart([block(1), block(2)]);
    expect(initial.activityEntrances.size).toBe(0);
    expect(initial.seenArrivalActivityIds).toEqual(new Set(['1', '2']));

    const empty = chart();
    update(empty, [block(3)]);
    expect([...empty.activityEntrances.keys()]).toEqual(['3']);
  });

  it('keeps concurrent arrivals and does not replay refreshed blocks or edits', () => {
    const instance = chart([block(1)]);
    update(instance, [block(1), block(2), block(3)]);
    expect([...instance.activityEntrances.keys()]).toEqual(['2', '3']);
    expect(instance.prepareActivityReflow).toHaveBeenCalledTimes(1);

    vi.mocked(performance.now).mockReturnValue(1100);
    update(instance, [block(1), block(2, { endTime: 200 }), block(3)]);
    expect(instance.activityEntrances.get('2')?.startedAt).toBe(1000);
    expect(instance.activityEntrances.get('2')?.block.endTime).toBe(200);
    expect(instance.prepareActivityReflow).toHaveBeenCalledTimes(1);

    instance.activityEntrances.clear();
    update(instance, [block(1), block(2, { startTime: 150 }), block(3)]);
    expect(instance.activityEntrances.size).toBe(0);
  });

  it('resets silently when the processed trace changes or first finishes loading', () => {
    const instance = chart([block(1)]);
    update(instance, [block(1), block(2)]);
    expect(instance.activityEntrances.size).toBe(1);
    update(instance, [block(4), block(5)], undefined, 2);
    expect(instance.activityEntrances.size).toBe(0);
    expect(instance.seenArrivalActivityIds).toEqual(new Set(['4', '5']));

    const loading = chart([], null);
    update(loading, [block(6)], undefined, 3);
    expect(loading.activityEntrances.size).toBe(0);
  });

  it('does not replay hidden arrivals when filters or viewport visibility change', () => {
    const instance = chart([block(1)]);
    const source = [block(1), block(2)];
    update(instance, source, [source[0]]);
    expect(instance.activityEntrances.size).toBe(0);
    update(instance, source);
    expect(instance.activityEntrances.size).toBe(0);
    expect(instance.seenArrivalActivityIds.has('2')).toBe(true);
  });

  it('marks collapsed and vertically offscreen arrivals seen without animating later', () => {
    const instance = chart([block(1)]);
    Object.assign(instance, { props: { ...instance.props, threads: { 1: { id: 1, name: 'Work', collapsed: true } } } });
    update(instance, [block(1), block(2)]);
    expect(instance.activityEntrances.size).toBe(0);

    Object.assign(instance, { props: { ...instance.props, threads: { 1: { id: 1, name: 'Work' } } } });
    vi.mocked(instance.getRenderedBlockTransform).mockReturnValue({ blockX: 100, blockY: 400, blockWidth: 200, blockHeight: 24 });
    update(instance, [block(1), block(2), block(3)]);
    expect(instance.activityEntrances.size).toBe(0);
    expect(instance.seenArrivalActivityIds).toEqual(new Set(['1', '2', '3']));
  });

  it('skips entrances for reduced motion and clears existing effects if it changes', () => {
    const instance = chart([block(1)]);
    update(instance, [block(1), block(2)]);
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }), removeEventListener: vi.fn() });
    expect(instance.drawActivityEntrance(context())).toBe(false);
    expect(instance.activityEntrances.size).toBe(0);
    update(instance, [block(1), block(2), block(3)]);
    expect(instance.activityEntrances.size).toBe(0);
    expect(instance.seenArrivalActivityIds.has('3')).toBe(true);
  });

  it('transfers an optimistic entrance to its persisted ID without restarting it', () => {
    const instance = chart([block(1)]);
    update(instance, [block(1), block('optimisticActivity')]);
    expect(instance.activityEntrances.get('optimisticActivity')?.startedAt).toBe(1000);
    vi.mocked(performance.now).mockReturnValue(1150);
    update(instance, [block(1), block(2)]);
    expect([...instance.activityEntrances.keys()]).toEqual(['2']);
    expect(instance.activityEntrances.get('2')?.startedAt).toBe(1000);
    expect(instance.activityEntrances.get('2')?.block.activity_id).toBe(2);
    expect(instance.prepareActivityReflow).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])('uses the double-click position for an arrival with scheduled=%s', scheduled => {
    const instance = chart([block(1)]);
    instance.hitTest = vi.fn(() => null);
    instance.pixelsToThreadId = vi.fn(() => 1);
    instance.pixelsToTime = vi.fn(() => 250.9);
    instance.onDoubleClick({ nativeEvent: { offsetX: 80, offsetY: 90 } } as never);
    expect(instance.props.createAt).toHaveBeenCalledExactlyOnceWith(1, 250);
    if (!scheduled) {
      update(instance, [block(1), block('optimisticActivity', { startTime: 250 })]);
      expect(instance.activityEntrances.get('optimisticActivity')?.origin).toEqual({ x: 80, y: 90 });
    }
    update(instance, [block(1), block(2, { startTime: 250, scheduled })]);
    expect(instance.activityEntrances.get('2')?.origin).toEqual({ x: 80, y: 90 });
    expect(instance.pendingActivityEntrance).toBeNull();
  });

  it.each(['block', 'block_edge_left', 'block_edge_right'])('does not create an activity when double-clicking a %s', type => {
    const instance = chart([block(1)]);
    instance.hitTest = vi.fn(() => ({ type, value: ['0', block(1)] }) as never);
    instance.pixelsToThreadId = vi.fn(() => 1);
    instance.onDoubleClick({ nativeEvent: { offsetX: 80, offsetY: 90 } } as never);

    expect(instance.props.createAt).not.toHaveBeenCalled();
    expect(instance.pendingActivityEntrance).toBeNull();
  });

  it('does not create an activity outside a thread', () => {
    const instance = chart([block(1)]);
    instance.hitTest = vi.fn(() => null);
    instance.pixelsToThreadId = vi.fn(() => null);
    instance.onDoubleClick({ nativeEvent: { offsetX: 80, offsetY: 90 } } as never);

    expect(instance.props.createAt).not.toHaveBeenCalled();
    expect(instance.pendingActivityEntrance).toBeNull();
  });

  it('animates successive local starts after each optimistic placeholder is replaced', () => {
    const instance = chart([block(1)]);
    update(instance, [block(1), block('optimisticActivity')]);
    update(instance, [block(1), block(2)]);
    vi.mocked(performance.now).mockReturnValue(1250);
    update(instance, [block(1), block(2), block('optimisticActivity', { startTime: 300 })]);
    expect(instance.activityEntrances.get('optimisticActivity')?.startedAt).toBe(1250);
    update(instance, [block(1), block(2), block(3, { startTime: 300 })]);
    expect(instance.activityEntrances.get('3')?.startedAt).toBe(1250);
    expect(instance.activityEntrances.has('optimisticActivity')).toBe(false);
  });

  it('removes deleted arrivals and releases effects at completion and unmount', () => {
    const instance = chart([block(1)]);
    update(instance, [block(1), block(2), block(3)]);
    update(instance, [block(1), block(3)]);
    expect([...instance.activityEntrances.keys()]).toEqual(['3']);
    vi.mocked(performance.now).mockReturnValue(1700);
    expect(instance.drawActivityEntrance(context())).toBe(false);
    expect(instance.activityEntrances.size).toBe(0);
    expect(instance.redrawChart).toHaveBeenCalled();

    update(instance, [block(1), block(3), block(4)]);
    instance.componentWillUnmount();
    expect(instance.activityEntrances.size).toBe(0);
    expect(instance.pendingActivityEntrance).toBeNull();
  });
});
