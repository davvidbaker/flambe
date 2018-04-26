import filter from 'lodash/fp/filter';
import reduce from 'lodash/fp/reduce';
import pipe from 'lodash/fp/pipe';

export function setCanvasSize(canvas, textPadding, isFlameChart) {
  const header = document.querySelector('header');
  const devicePixelRatio = window.devicePixelRatio;

  const ctx = canvas.getContext('2d');

  const minTextWidth = textPadding.x + ctx.measureText('\u2026').textWidth;

  const state = {
    devicePixelRatio,
    canvasWidth: window.innerWidth,
    canvasHeight: isFlameChart
      ? window.innerHeight - header.clientHeight - 100
      : 50
  };

  return {
    ctx,
    minTextWidth,
    state
  };
}

export function pixelsToTime(
  x,
  leftBoundaryTime,
  rightBoundaryTime,
  canvasWidth
) {
  return (
    leftBoundaryTime + x * (rightBoundaryTime - leftBoundaryTime) / canvasWidth
  );
}

export function timeToPixels(
  timestamp: number,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  canvasWidth: number
) {
  return (
    (timestamp - leftBoundaryTime) *
    canvasWidth /
    (rightBoundaryTime - leftBoundaryTime)
  );
}

export function getBlockTransform(
  startTime: number,
  endTime: number,
  level: number,
  blockHeight: number,
  offsetFromTop: number,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  canvasWidth: number
): { blockX: number, blockY: number, blockWidth: number } {
  if (endTime == null) {
    // eslint-disable-next-line no-param-reassign
    endTime = rightBoundaryTime;
  }

  const blockX = timeToPixels(
    startTime > leftBoundaryTime ? startTime : leftBoundaryTime,
    leftBoundaryTime,
    rightBoundaryTime,
    canvasWidth
  );
  const blockY = level * (1 + blockHeight) + offsetFromTop; // 👈 the + 1 is a margin
  const blockWidth =
    timeToPixels(endTime, leftBoundaryTime, rightBoundaryTime, canvasWidth) -
    blockX;

  return { blockX, blockY, blockWidth };
}

export function drawFutureWindow(
  ctx,
  leftBoundaryTime,
  rightBoundaryTime,
  canvasWidth,
  canvasHeight
) {
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#B6C8E8';
  ctx.strokeStyle = '#7B9EDE';
  const now = Date.now();

  if (now < rightBoundaryTime) {
    const nowPixels = timeToPixels(
      now,
      leftBoundaryTime,
      rightBoundaryTime,
      canvasWidth
    );
    ctx.fillRect(nowPixels, 0, canvasWidth - nowPixels + 10, canvasHeight);
    ctx.strokeRect(nowPixels, 0, canvasWidth - nowPixels + 10, canvasHeight);
  }
}

export function visibleThreadLevels(
  blocks,
  activities,
  leftBoundaryTime,
  rightBoundaryTime,
  threads
) {
  return pipe(
    filter(({ startTime, endTime }) =>
      (startTime > leftBoundaryTime && startTime < rightBoundaryTime) ||
        (endTime > leftBoundaryTime && endTime < rightBoundaryTime) ||
        (startTime < leftBoundaryTime && endTime > rightBoundaryTime) ||
        (startTime < leftBoundaryTime && !endTime)),

    reduce((acc, block) => {
      const { thread_id } = activities[block.activity_id];

      return {
        ...acc,
        [thread_id]: {
          max: Math.max(
            acc[thread_id] ? acc[thread_id].max : 1,
            block.level + 1
          ),
          current: block.level
        }
      };
    }, reduce((acc, { id }) => ({ ...acc, [id]: { current: 0, max: 0 } }), {})(threads))
  )(blocks);
}
