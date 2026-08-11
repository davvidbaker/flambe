import type { EntityId } from '../types/ids';
import type { TraceBlock } from './processTrace';

export interface TimelineActivity {
  thread_id?: EntityId;
}

export interface ThreadLevel {
  current: number;
  max: number;
}

export function pixelsToTime(
  x: number,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  canvasWidth: number,
): number {
  return leftBoundaryTime + (x * (rightBoundaryTime - leftBoundaryTime)) / canvasWidth;
}

export function timeToPixels(
  timestamp: number,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  canvasWidth: number,
): number {
  return ((timestamp - leftBoundaryTime) * canvasWidth) / (rightBoundaryTime - leftBoundaryTime);
}

export function getBlockY(level: number, blockHeight: number, offsetFromTop: number): number {
  return level * (1 + blockHeight) + offsetFromTop;
}

export function getBlockTransform(
  startTime: number,
  endTime: number | null | undefined,
  level: number,
  blockHeight: number,
  offsetFromTop: number,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  canvasWidth: number,
): { blockX: number; blockY: number; blockWidth: number } {
  const resolvedEndTime = endTime ?? rightBoundaryTime;
  const blockX = timeToPixels(
    Math.max(startTime, leftBoundaryTime),
    leftBoundaryTime,
    rightBoundaryTime,
    canvasWidth,
  );
  return {
    blockX,
    blockY: getBlockY(level, blockHeight, offsetFromTop),
    blockWidth: timeToPixels(resolvedEndTime, leftBoundaryTime, rightBoundaryTime, canvasWidth) - blockX,
  };
}

export function drawFutureWindow(
  context: CanvasRenderingContext2D,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const now = Date.now();
  if (now >= rightBoundaryTime) return;

  const nowPixels = timeToPixels(now, leftBoundaryTime, rightBoundaryTime, canvasWidth);
  context.globalAlpha = 0.2;
  context.fillStyle = '#B6C8E8';
  context.strokeStyle = '#7B9EDE';
  context.fillRect(nowPixels, 0, canvasWidth - nowPixels + 10, canvasHeight);
  context.strokeRect(nowPixels, 0, canvasWidth - nowPixels + 10, canvasHeight);
}

export function isVisible(
  block: Pick<TraceBlock, 'startTime' | 'endTime'>,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
): boolean {
  const { startTime, endTime } = block;
  return (
    (startTime > leftBoundaryTime && startTime < rightBoundaryTime) ||
    (endTime !== undefined && endTime > leftBoundaryTime && endTime < rightBoundaryTime) ||
    (startTime < leftBoundaryTime && endTime !== undefined && endTime > rightBoundaryTime) ||
    (startTime < leftBoundaryTime && !endTime)
  );
}

export function visibleThreadLevels(
  blocks: TraceBlock[],
  activities: Record<string, TimelineActivity>,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  threads: Record<string, { id?: EntityId }>,
): Record<string, ThreadLevel> {
  const levels = Object.fromEntries(
    Object.entries(threads).map(([id]) => [id, { current: 0, max: 0 }]),
  ) as Record<string, ThreadLevel>;

  blocks.filter(block => isVisible(block, leftBoundaryTime, rightBoundaryTime)).forEach(block => {
    const threadId = activities[String(block.activity_id)]?.thread_id;
    if (threadId === undefined) return;
    const key = String(threadId);
    const current = levels[key] ?? { current: 0, max: 0 };
    levels[key] = { current: block.level, max: Math.max(current.max, block.level + 1) };
  });

  return levels;
}
