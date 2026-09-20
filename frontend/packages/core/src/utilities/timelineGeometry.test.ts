import {
  getBlockTransform,
  insetBlockHeight,
  isVisible,
  pixelsToTime,
  rankThreadsByAttention,
  sortThreadsByRank,
  timeToPixels,
  visibleThreadLevels,
} from './timelineGeometry';
import type { TraceBlock } from './processTrace';

describe('timeline geometry', () => {
  it('round-trips a timestamp through pixel coordinates', () => {
    expect(pixelsToTime(timeToPixels(150, 100, 200, 500), 100, 200, 500)).toBe(150);
    expect(getBlockTransform(90, 150, 2, 20, 10, 100, 200, 500)).toEqual({
      blockX: 0, blockY: 52, blockWidth: 250,
    });
  });

  it('insets agent bars from the row pitch so selection can match draw', () => {
    expect(insetBlockHeight(20, 0)).toBe(20);
    expect(insetBlockHeight(20, 2)).toBe(16);
    expect(insetBlockHeight(20, 4)).toBe(12);
    expect(insetBlockHeight(6, 4)).toBe(4);
  });

  it('finds visible blocks and their thread depth', () => {
    const block: TraceBlock = {
      activity_id: 4,
      beginning: 'B',
      events: [1],
      level: 2,
      startTime: 120,
    };
    expect(isVisible(block, 100, 200)).toBe(true);
    expect(visibleThreadLevels([block], { 4: { thread_id: 2 } }, 100, 200, { 2: { id: 2 } })).toEqual({
      2: { current: 2, max: 3 },
    });
  });

  it('orders threads by their most recent attention shift', () => {
    const threads = { 1: { id: 1, rank: 0 }, 2: { id: 2, rank: 1 } };
    expect(sortThreadsByRank(rankThreadsByAttention([
      { thread_id: 1 }, { thread_id: 2 }, { thread_id: 1 },
    ], threads))).toEqual([
      [1, { id: 1, rank: 0 }],
      [2, { id: 2, rank: 1 }],
    ]);
  });
});
