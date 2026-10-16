import type { MouseEvent as ReactMouseEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlameChart } from './FlameChart';

const event = (overrides = {}) => ({
  button: 0, shiftKey: false, metaKey: false, ctrlKey: false,
  nativeEvent: { offsetX: 120, offsetY: 60 }, preventDefault: vi.fn(),
  ...overrides,
} as unknown as ReactMouseEvent<HTMLCanvasElement>);

beforeEach(() => {
  vi.stubGlobal('window', {
    innerWidth: 1280, matchMedia: () => ({ matches: false }),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), setTimeout: vi.fn(),
  });
  vi.stubGlobal('HTMLElement', class {});
});
afterEach(() => vi.unstubAllGlobals());

function chart() {
  const blocks = [{ activity_id: 1 }, { activity_id: 2 }, { activity_id: 1 }];
  const activities = { 1: { id: 1, thread_id: 7 }, 2: { id: 2, thread_id: 7, parent_id: 1 } };
  const props = {
    threads: { 7: { id: 7 } }, activities, blocks, modifiers: { shift: false },
    selectedActivityIds: [], focusedBlockIndex: null,
    focusBlock: vi.fn(), selectActivities: vi.fn(), updateScheduled: vi.fn(),
  };
  const instance = new FlameChart(props as never);
  instance.width = 200;
  instance.canvas = { getBoundingClientRect: () => ({ left: 0, top: 0 }) } as HTMLCanvasElement;
  instance.hitTest = vi.fn(() => null);
  instance.redrawMeasurement = vi.fn();
  instance.pixelsToTime = vi.fn(value => value);
  instance.paintableBlocks = blocks as never;
  instance.renderActivities = activities as never;
  instance.getAnimatedBlockTransform = vi.fn((block) => ({
    blockX: 20, blockY: block.activity_id === 1 ? 20 : 80, blockWidth: 70, blockHeight: 20,
  }));
  return { instance, props };
}

describe('timeline selection gestures', () => {
  it('supports reverse drags, deduplicates activity segments, and excludes untouched children', () => {
    const { instance, props } = chart();
    instance.onMouseDown(event());
    instance.onMarqueeMove({ clientX: 0, clientY: 0 } as MouseEvent);
    instance.onMarqueeUp();
    expect(props.selectActivities).toHaveBeenCalledWith(['1']);
    expect(instance.marquee).toBeNull();
    expect(instance.suppressNextClick).toBe(true);
    instance.onClick(event());
    expect(props.selectActivities).toHaveBeenCalledTimes(1);
  });

  it('leaves clicks under the drag threshold to ordinary click handling', () => {
    const { instance, props } = chart();
    instance.onMouseDown(event());
    instance.onMarqueeMove({ clientX: 122, clientY: 61 } as MouseEvent);
    instance.onMarqueeUp();
    expect(props.selectActivities).not.toHaveBeenCalled();
    instance.onClick(event());
    expect(props.selectActivities).toHaveBeenCalledWith([]);
  });

  it('keeps Shift-drag measuring time', () => {
    const { instance, props } = chart();
    props.modifiers.shift = true;
    instance.onMouseDown(event({ shiftKey: true }));
    expect(instance.marquee).toBeNull();
    expect(instance.measuring).toBe(true);
  });

  it('adds to an ordinary focused activity with Cmd-click without moving scheduled blocks', () => {
    const { instance, props } = chart();
    props.focusedBlockIndex = 0 as never;
    instance.hitTest = vi.fn(() => ({ type: 'block', value: ['1', { activity_id: 2, scheduled: true }] } as never));
    instance.onMouseDown(event({ metaKey: true }));
    expect(instance.movingScheduledBlock).toBeNull();
    instance.onClick(event({ metaKey: true }));
    expect(props.selectActivities).toHaveBeenCalledWith(['1', '2']);
  });

  it('toggles a selected activity off and clears with Escape', () => {
    const { instance, props } = chart();
    props.selectedActivityIds = ['1', '2'] as never;
    instance.hitTest = vi.fn(() => ({ type: 'block', value: ['1', { activity_id: 2 }] } as never));
    instance.onClick(event({ ctrlKey: true }));
    expect(props.selectActivities).toHaveBeenLastCalledWith(['1']);
    instance.onSelectionKeyDown({ key: 'Escape', target: null } as KeyboardEvent);
    expect(props.selectActivities).toHaveBeenLastCalledWith([]);
  });

  it.each(['narrow', 'touch'])('does not start a marquee on %s screens', mode => {
    if (mode === 'narrow') window.innerWidth = 390;
    else window.matchMedia = (() => ({ matches: true })) as never;
    const { instance } = chart();
    instance.onMouseDown(event());
    expect(instance.marquee).toBeNull();
  });
});
