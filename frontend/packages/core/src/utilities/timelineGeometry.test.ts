import {
  getBlockTransform,
  insetBlockHeight,
  isOpenScheduledEndHandle,
  isPaintableBlock,
  isVisible,
  pixelsToTime,
  rankThreadsByAttention,
  rightAlignedActivityLabelX,
  shiftedScheduledActivity,
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

  it('omits subpixel spans while retaining scheduled point markers', () => {
    const span = { startTime: 100, endTime: 100.5 };
    expect(isPaintableBlock(span, 0, 1000, 100)).toBe(false);
    expect(isPaintableBlock(span, 100, 110, 100)).toBe(true);
    expect(isPaintableBlock({ ...span, scheduledPoint: true }, 0, 1000, 100)).toBe(true);
    expect(isPaintableBlock({ startTime: -10, endTime: 10 }, 0, 1000, 100)).toBe(true);
  });

  it('anchors a running activity name to the present line when past and future are both on screen', () => {
    const running: Pick<TraceBlock, 'startTime' | 'endTime' | 'scheduled'> = { startTime: 100 };
    const anchor = (now: number, block = running, blockX = 50, blockWidth = 450) =>
      rightAlignedActivityLabelX(block, blockX, blockWidth, now, 0, 1000, 1000, 5);

    expect(anchor(400)).toBe(395);
    expect(anchor(1200)).toBe(495);
    expect(anchor(-20)).toBe(495);
    expect(anchor(400, { startTime: 100, endTime: 250 }, 50, 200)).toBe(245);
    expect(anchor(400, { ...running, scheduled: true })).toBe(495);
    expect(anchor(400, { startTime: 600 })).toBe(495);
    expect(anchor(400, running, 100, 50)).toBe(145);
  });

  it('keeps completed labels at the visible edge when their bars end off screen', () => {
    const finished = { startTime: 100, endTime: 1500 };
    for (const now of [400, 1200, -20]) {
      expect(rightAlignedActivityLabelX(finished, 100, 1400, now, 0, 1000, 1000, 5, 300)).toBe(995);
    }
    // Panning the bar back into view restores its actual right edge.
    expect(rightAlignedActivityLabelX(finished, 100, 600, 400, 0, 2000, 1000, 5, 300)).toBe(695);
    expect(rightAlignedActivityLabelX({ ...finished, scheduled: true }, 100, 1400, 400, 0, 1000, 1000, 5)).toBe(995);
  });

  it('flows running labels into the future before truncating at the screen edge', () => {
    const running = { startTime: 100 };
    const anchor = (textWidth: number, textLeft = 105, blockWidth = 900) =>
      rightAlignedActivityLabelX(running, 100, blockWidth, 200, 0, 1000, 1000, 5, textWidth, textLeft);

    expect(anchor(50)).toBe(195); // Short names still end at the precipice.
    expect(anchor(300)).toBe(405); // Full name extends right from its available left edge.
    expect(anchor(1200)).toBe(995); // Only names exceeding the viewport need shortening.
    expect(anchor(1200, 105, 1500)).toBe(995); // Even if the bar extends off screen.
    expect(anchor(300, 180)).toBe(480); // Respect the sticky actor gutter.
    const finished = { startTime: 100, endTime: 200 };
    expect(rightAlignedActivityLabelX(finished, 100, 100, 200, 0, 1000, 1000, 5, 300)).toBe(195);
  });

  it('uses the viewport edge as the end handle for an open scheduled span', () => {
    const plan = { scheduled: true, endTime: undefined };
    expect(isOpenScheduledEndHandle(plan, 40, 95, 100)).toBe(true);
    expect(isOpenScheduledEndHandle(plan, 40, 80, 100)).toBe(false);
    expect(isOpenScheduledEndHandle({ ...plan, endTime: 90 }, 40, 95, 100)).toBe(false);
    expect(isOpenScheduledEndHandle({ ...plan, scheduledPoint: true }, 40, 95, 100)).toBe(false);
  });

  it('moves scheduled spans together and keeps end-only plans as points', () => {
    expect(shiftedScheduledActivity({ startTime: 100, endTime: 200 }, 25, 4)).toEqual({
      thread_id: 4,
      scheduled_start_integer: 125,
      scheduled_end_integer: 225,
    });
    expect(shiftedScheduledActivity({ startTime: 100 }, 25, 4)).toEqual({
      thread_id: 4,
      scheduled_start_integer: 125,
    });
    expect(shiftedScheduledActivity({ startTime: 100, endTime: 100, scheduledPoint: true }, 25, 4))
      .toEqual({ thread_id: 4, scheduled_end_integer: 125 });
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
