import { describe, expect, it } from 'vitest';
import { createOctober14OvernightFixture } from '../storybook/october14OvernightFixture';
import processTrace from './processTrace';
import { blockLayoutKey, coalesceActorLaneChrome, projectActorLaneLayout } from './actorFlames';
import { interpolateNavigationLayout, interpolateNavigationChrome, retainNavigationRows } from './navigationLayout';

describe('navigation layout on the overnight capture', () => {
  const fixture = createOctober14OvernightFixture();
  const trace = processTrace(fixture.events, fixture.threads);
  const cut = Date.parse('2026-10-14T23:00:00-06:00');
  const early = trace.blocks.filter(block => block.startTime < cut);
  const late = trace.blocks.filter(block => (block.endTime ?? Infinity) >= cut);

  it('preserves relative rows within existing actors while allowing band growth', () => {
    const initial = projectActorLaneLayout(trace.activities, early);
    const compact = projectActorLaneLayout(trace.activities, late);
    const held = retainNavigationRows(compact, initial, late, trace.activities, trace.blocks);
    const shifts = new Map<string, number>();
    for (const block of early) {
      const key = blockLayoutKey(block);
      const actor = trace.activities[String(block.activity_id)]!.agent_id ?? 'human';
      const shift = held.rowByBlock[key]! - initial.rowByBlock[key]!;
      if (shifts.has(actor)) expect(shift).toBe(shifts.get(actor));
      shifts.set(actor, shift);
    }
    // Revisiting the first window keeps the grown band positions.
    const revisited = retainNavigationRows(initial, held, early, trace.activities, trace.blocks);
    for (const block of early) {
      expect(revisited.rowByBlock[blockLayoutKey(block)]).toBe(held.rowByBlock[blockLayoutKey(block)]);
    }
    expect(held.maxRowsByThread['1']).toBeGreaterThanOrEqual(compact.maxRowsByThread['1']!);
    expect(interpolateNavigationLayout(held, compact, 1)).toEqual(compact);
  });

  it('reveals work within the agent band and pushes a neighboring band aside', () => {
    const a = { id: 1, agent_id: 'codex:a', categories: [], thread_id: 1 };
    const b = { id: 2, agent_id: 'codex:b', categories: [], thread_id: 1 };
    const child = { ...a, id: 3, parent_id: 1 };
    const sample = processTrace([
      { id: 1, activity: a, phase: 'B', timestamp: 0 },
      { id: 2, activity: b, phase: 'B', timestamp: 1 },
      { id: 3, activity: child, phase: 'B', timestamp: 20 },
      { id: 4, activity: child, phase: 'E', timestamp: 30 },
    ], [{ id: 1, name: 'Sample' }]);
    const roots = sample.blocks.filter(block => block.activity_id !== 3);
    const before = projectActorLaneLayout(sample.activities, roots);
    const target = projectActorLaneLayout(sample.activities, sample.blocks);
    const held = retainNavigationRows(target, before, sample.blocks, sample.activities, sample.blocks);
    expect(held.rowByActivity['1']).toBe(0);
    expect(held.rowByActivity['3']).toBe(1);
    expect(held.rowByActivity['2']).toBe(2);
    const wash = coalesceActorLaneChrome(held, sample.blocks).find(band => band.rootActivityIds.includes(1))!;
    expect(wash.washRowRanges).toEqual([{ rowStart: 0, rowEnd: 1 }]);
    const childOnly = sample.blocks.filter(block => block.activity_id === 3);
    const childLayout = projectActorLaneLayout(sample.activities, childOnly);
    const ancestorRevealed = retainNavigationRows(target, childLayout, sample.blocks, sample.activities, sample.blocks);
    expect(ancestorRevealed.rowByActivity['1']).toBeLessThan(ancestorRevealed.rowByActivity['3']!);
  });

  it('moves bars, chrome, and thread height through finite intermediate geometry', () => {
    const initial = projectActorLaneLayout(trace.activities, early);
    const compact = projectActorLaneLayout(trace.activities, late);
    const held = retainNavigationRows(compact, initial, late, trace.activities, trace.blocks);
    const halfway = interpolateNavigationLayout(held, compact, 0.5);
    for (const block of late) {
      const key = blockLayoutKey(block);
      const row = halfway.rowByBlock[key]!;
      expect(row).toBeGreaterThanOrEqual(Math.min(held.rowByBlock[key]!, compact.rowByBlock[key]!));
      expect(row).toBeLessThanOrEqual(Math.max(held.rowByBlock[key]!, compact.rowByBlock[key]!));
    }
    const chrome = coalesceActorLaneChrome(halfway, late);
    expect(chrome.length).toBeGreaterThan(0);
    expect(chrome.every(band => Number.isFinite(band.rowStart) && Number.isFinite(band.rowEnd))).toBe(true);
    expect(halfway.maxRowsByThread['1']).toBeGreaterThanOrEqual(compact.maxRowsByThread['1']!);
  });

  it('animates height down when all work leaves the window', () => {
    const initial = projectActorLaneLayout(trace.activities, early);
    const empty = projectActorLaneLayout(trace.activities, []);
    const halfway = interpolateNavigationLayout(initial, empty, 0.5);
    expect(halfway.maxRowsByThread['1']).toBeGreaterThan(0);
    expect(halfway.maxRowsByThread['1']).toBeLessThan(initial.maxRowsByThread['1']!);
    expect(interpolateNavigationLayout(initial, empty, 1)).toEqual(empty);
  });

  it('keeps a continuous wash while individual rows are at fractional positions', () => {
    const compact = projectActorLaneLayout(trace.activities, trace.blocks);
    const expanded = {
      ...compact,
      rowByBlock: Object.fromEntries(Object.entries(compact.rowByBlock).map(([key, row]) => [key, row * 2])),
      rowByActivity: Object.fromEntries(Object.entries(compact.rowByActivity).map(([key, row]) => [key, row * 2])),
      lanes: compact.lanes.map(lane => ({ ...lane, rowStart: lane.rowStart * 2, rowEnd: lane.rowEnd * 2 })),
    };
    const endpoint = coalesceActorLaneChrome(compact, trace.blocks);
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const chrome = interpolateNavigationChrome(expanded, compact, trace.blocks, progress);
      for (let index = 0; index < chrome.length; index += 1) {
        expect(chrome[index]!.washRects).toHaveLength(endpoint[index]!.washRects.length);
        expect(chrome[index]!.washRects.every(rect => rect.rowEnd >= rect.rowStart)).toBe(true);
      }
    }
  });
});
