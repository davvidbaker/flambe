import filter from 'lodash/fp/filter';
import entries from 'lodash/fp/entries';
import reduce from 'lodash/fp/reduce';
import pipe from 'lodash/fp/pipe';
import sortBy from 'lodash/fp/sortBy';
import map from 'lodash/fp/map';
import reverse from 'lodash/fp/reverse';
import isUndefined from 'lodash/fp/isUndefined';

export function pixelsToTime(
  x,
  leftBoundaryTime,
  rightBoundaryTime,
  canvasWidth
) {
  return (
    leftBoundaryTime +
    (x * (rightBoundaryTime - leftBoundaryTime)) / canvasWidth
  );
}

export function timeToPixels(
  timestamp: number,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  canvasWidth: number
) {
  return (
    ((timestamp - leftBoundaryTime) * canvasWidth) /
    (rightBoundaryTime - leftBoundaryTime)
  );
}

export function getBlockY(level, blockHeight, offsetFromTop) {
  return level * (1 + blockHeight) + offsetFromTop; // 👈 the + 1 is a margin
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
  const blockY = getBlockY(level, blockHeight, offsetFromTop);
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

export function isVisible(
  { startTime, endTime },
  leftBoundaryTime,
  rightBoundaryTime
) {
  return (
    (startTime > leftBoundaryTime && startTime < rightBoundaryTime) ||
    (endTime > leftBoundaryTime && endTime < rightBoundaryTime) ||
    (startTime < leftBoundaryTime && endTime > rightBoundaryTime) ||
    (startTime < leftBoundaryTime && !endTime)
  );
}

export function visibleThreadLevels(
  blocks,
  activities,
  leftBoundaryTime,
  rightBoundaryTime,
  threads
) {
  /* ⚠️ weird code ahead. Should use a better pattern for *this* kinda thing. something something currying */
  function thisIsVisible(block) {
    return isVisible(block, leftBoundaryTime, rightBoundaryTime);
  }

  return pipe(
    filter(thisIsVisible),

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

export function rankThreadsByAttention(attentionShifts, threads) {
  /* 💁 attentionShifts should already be ordered chronologically */

  /* ⚠️ maybe bad code ahead */
  let rank = 0;
  const ranks = pipe(
    reverse,
    reduce((acc, { thread_id }) => {
      if (isUndefined(acc[thread_id])) {
        acc[thread_id] = rank;
        if (threads[thread_id]) threads[thread_id].rank = rank;
        rank++;
      }
      return acc;
    }, {})
  )(attentionShifts);

  // return map(thread => {...thread})(threads)

  return threads;
}

export function sortThreadsByRank(threads) {
  return pipe(
    entries,
    sortBy(([_id, { rank }]) => rank),
    map(([key, val]) => [Number(key), val])
  )(threads);
}
