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
  canvasWidth,
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
  canvasWidth: number,
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
  canvasWidth: number,
): { blockX: number, blockY: number, blockWidth: number } {
  if (endTime == null) {
    // eslint-disable-next-line no-param-reassign
    endTime = rightBoundaryTime;
  }

  const blockX = timeToPixels(
    startTime > leftBoundaryTime ? startTime : leftBoundaryTime,
    leftBoundaryTime,
    rightBoundaryTime,
    canvasWidth,
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
  canvasHeight,
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
      canvasWidth,
    );
    ctx.fillRect(nowPixels, 0, canvasWidth - nowPixels + 10, canvasHeight);
    ctx.strokeRect(nowPixels, 0, canvasWidth - nowPixels + 10, canvasHeight);
  }
}

export function isVisible(
  { startTime, endTime },
  leftBoundaryTime,
  rightBoundaryTime,
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
  threads,
) {
  /* ⚠️ weird code ahead. Should use a better pattern for *this* kinda thing. something something currying */
  function thisIsVisible(block) {
    return isVisible(block, leftBoundaryTime, rightBoundaryTime);
  }
  return (
    blocks
    |> filter(thisIsVisible)
    |> reduce((acc, block) => {
      const { thread_id } = activities[block.activity_id];

      return {
        ...acc,
        [thread_id]: {
          max: Math.max(
            acc[thread_id] ? acc[thread_id].max : 1,
            block.level + 1,
          ),
          current: block.level,
        },
      };
    }, threads |> reduce((acc, { id }) => ({ ...acc, [id]: { current: 0, max: 0 } }), {}))
  );
}

export function rankThreadsByAttention(attentionShifts, threads) {
  /* 💁 attentionShifts should already be ordered chronologically */

  /* ⚠️ maybe bad code ahead */
  let rank = 0;
  const ranks =
    attentionShifts
    |> reverse
    |> reduce((acc, { thread_id }) => {
      if (isUndefined(acc[thread_id])) {
        acc[thread_id] = rank;
        if (threads[thread_id]) threads[thread_id].rank = rank;
        rank++;
      }
      return acc;
    }, {});

  return threads;
}

export function sortThreadsByRank(threads) {
  return (
    threads
    |> entries
    |> sortBy(([_id, { rank }]) => rank)
    |> map(([key, val]) => [Number(key), val])
  );
}

/* ⚠️ by no means was this a *GOOD* idea */
export const handleWheel = (
  e: SyntheticWheelEvent<HTMLCanvasElement>,
  that,
) => {
  const { pixelsToTime, state, props, setState, draw } = that;

  e.preventDefault();
  const zoomCenterTime = pixelsToTime.bind(that).apply(e.nativeEvent.offsetX);

  // pan around if holding shift or scroll was mostly vertical
  if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
    // props.pan just does left right panning of the timeline
    props.pan(e.deltaX, 0, state.canvasWidth);

    requestAnimationFrame(draw.bind(that));
  } else if (e.getModifierState('Shift')) {
    if (typeof e.deltaY === 'number') {
      setState({ scrollTop: state.scrollTop + Number(e.deltaY) });
    }
  } else {
    props.zoom(
      e.deltaY,
      e.nativeEvent.offsetX,
      zoomCenterTime,
      state.canvasWidth,
    );
    requestAnimationFrame(draw.bind(that));
  }
};

export const handleWheel2 = e => (
  pixelsToTime,
  canvasWidth,
  scrollTop,
  rAF_func,
  zoom,
  pan,
  setState,
) => {
  e.preventDefault();
  const zoomCenterTime = pixelsToTime(e.nativeEvent.offsetX);

  // pan around if holding shift or scroll was mostly vertical
  if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
    // props.pan just does left right panning of the timeline
    pan(e.deltaX, 0, canvasWidth);

    requestAnimationFrame(rAF_func);
  } else if (e.getModifierState('Shift')) {
    if (typeof e.deltaY === 'number') {
      setState({ scrollTop: scrollTop + Number(e.deltaY) });
    }
  } else {
    zoom(e.deltaY, e.nativeEvent.offsetX, zoomCenterTime, canvasWidth);
    requestAnimationFrame(rAF_func);
  }
};

/* ⚠️ probably not a good idea to rely on `this` in here, but the other ways look like they've been much less performant */
export function handleWheel3(e: SyntheticWheelEvent<HTMLCanvasElement>) {
  e.preventDefault();
  const zoomCenterTime = this.pixelsToTime(e.nativeEvent.offsetX);

  // pan around if holding shift or scroll was mostly vertical
  if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
    // props.pan just does left right panning of the timeline
    this.props.pan(e.deltaX, 0, this.state.canvasWidth);

    requestAnimationFrame(this.draw.bind(this));
  } else if (e.getModifierState('Shift')) {
    if (typeof e.deltaY === 'number') {
      this.setState({ scrollTop: this.state.scrollTop + Number(e.deltaY) });
    }
  } else {
    this.props.zoom(
      e.deltaY,
      e.nativeEvent.offsetX,
      zoomCenterTime,
      this.state.canvasWidth,
    );
    requestAnimationFrame(this.draw.bind(this));
  }
}
