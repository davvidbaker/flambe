import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlameChart } from './FlameChart';
import { createOctober14OvernightFixture, october14OvernightViewport } from '../storybook/october14OvernightFixture';
import processTrace from '../utilities/processTrace';
import { blockLayoutKey, projectActorLaneLayout } from '../utilities/actorFlames';
import { NAVIGATION_REFLOW_MS, NAVIGATION_SETTLE_MS } from '../utilities/navigationLayout';

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('window', { matchMedia: () => ({ matches: false }), removeEventListener: vi.fn() });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function chart() {
  const fixture = createOctober14OvernightFixture();
  const trace = processTrace(fixture.events, fixture.threads);
  const instance = new FlameChart({ blocks: trace.blocks, activities: trace.activities, threads: trace.threads } as never);
  instance.width = 1000;
  instance.leftBoundaryTime = october14OvernightViewport.leftBoundaryTime;
  instance.rightBoundaryTime = october14OvernightViewport.rightBoundaryTime;
  instance.redrawChart = vi.fn();
  instance.ensureActorLaneLayout();
  return instance;
}

describe('activity row spacing', () => {
  it('keeps bar heights and row gaps uniform across delegated washes', () => {
    const instance = chart();
    instance.offsets = { 1: 0 };
    instance.threadCollapsed = () => false;
    instance.actorLaneLayout = {
      rootIdByActivity: { 1: 1, 2: 1, 3: 3, 4: 3, 5: 5, 6: 5 },
      lanes: [
        { rootActivityId: 1, depth: 0 },
        { rootActivityId: 3, depth: 1 },
        { rootActivityId: 5, depth: 2 },
      ],
      rowByActivity: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 },
      rowByBlock: {},
    } as never;
    const transforms = [1, 2, 3, 4, 5, 6].map(id => instance.getRenderedBlockTransform(
      { activity_id: id, startTime: 0, endTime: 10, level: id - 1, events: [] } as never,
      { id, thread_id: 1 } as never,
    ));
    expect(new Set(transforms.map(block => block.blockHeight)).size).toBe(1);
    const gaps = transforms.slice(1).map((block, index) =>
      block.blockY - (transforms[index]!.blockY + transforms[index]!.blockHeight));
    expect(gaps).toEqual(Array(5).fill(1 + 2 * FlameChart.actorLaneVerticalMargin));
  });
});

describe('navigation settling lifecycle', () => {
  it('animates neighboring bands aside when newly visible work grows a wash', () => {
    const a = { id: 1, agent_id: 'codex:a', categories: [], thread_id: 1 };
    const b = { id: 2, agent_id: 'codex:b', categories: [], thread_id: 1 };
    const child = { ...a, id: 3, parent_id: 1 };
    const trace = processTrace([
      { id: 1, activity: a, phase: 'B', timestamp: 0 },
      { id: 2, activity: b, phase: 'B', timestamp: 1 },
      { id: 3, activity: child, phase: 'B', timestamp: 30 },
    ], [{ id: 1, name: 'Sample' }]);
    const instance = new FlameChart({ blocks: trace.blocks, activities: trace.activities, threads: trace.threads } as never);
    instance.width = 1000;
    instance.leftBoundaryTime = 10;
    instance.rightBoundaryTime = 20;
    instance.redrawChart = vi.fn();
    instance.ensureActorLaneLayout();
    instance.rightBoundaryTime = 40;
    instance.ensureActorLaneLayout();
    expect(instance.navigationTransition).not.toBeNull();
    expect(instance.navigationTransition!.to.rowByActivity['3']).toBe(1);
    expect(instance.navigationTransition!.to.rowByActivity['2']).toBe(2);
    const startedAt = instance.navigationTransition!.startedAt;
    vi.spyOn(performance, 'now').mockReturnValue(startedAt + NAVIGATION_REFLOW_MS / 2);
    const halfway = instance.ensureActorLaneLayout();
    expect(halfway.rowByActivity['2']).toBeGreaterThan(1);
    expect(halfway.rowByActivity['2']).toBeLessThan(2);
  });

  it('holds rows, restarts the idle timer, animates, and finishes at compact geometry', () => {
    const instance = chart();
    const initial = instance.actorLaneLayout!;
    instance.leftBoundaryTime = Date.parse('2026-10-14T23:20:00-06:00');
    const held = instance.ensureActorLaneLayout();
    for (const block of instance.paintableBlocks) {
      const key = blockLayoutKey(block);
      expect(held.rowByBlock[key]).toBe(initial.rowByBlock[key]);
    }
    vi.advanceTimersByTime(NAVIGATION_SETTLE_MS - 1);
    instance.leftBoundaryTime += 1000;
    instance.ensureActorLaneLayout();
    vi.advanceTimersByTime(1);
    expect(instance.navigationTransition).toBeNull();
    vi.advanceTimersByTime(NAVIGATION_SETTLE_MS);
    expect(instance.navigationTransition).not.toBeNull();
    const startedAt = instance.navigationTransition!.startedAt;
    vi.spyOn(performance, 'now').mockReturnValue(startedAt + NAVIGATION_REFLOW_MS / 2);
    instance.ensureActorLaneLayout();
    expect(instance.navigationTransition).not.toBeNull();
    vi.mocked(performance.now).mockReturnValue(startedAt + NAVIGATION_REFLOW_MS);
    expect(instance.ensureActorLaneLayout()).toEqual(projectActorLaneLayout(instance.renderActivities, instance.paintableBlocks));
    expect(instance.navigationTransition).toBeNull();
    expect(instance.redrawChart).toHaveBeenCalled();
  });

  it('skips animation for reduced motion and clears pending timers on unmount', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }), removeEventListener: vi.fn() });
    const instance = chart();
    instance.leftBoundaryTime += 60_000;
    instance.ensureActorLaneLayout();
    vi.advanceTimersByTime(NAVIGATION_SETTLE_MS);
    expect(instance.navigationTransition).toBeNull();
    instance.leftBoundaryTime += 60_000;
    instance.ensureActorLaneLayout();
    instance.componentWillUnmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
