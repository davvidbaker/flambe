export function setCanvasSize(canvas, textPadding, isFlameChart) {
  const header = document.querySelector('header');
  const devicePixelRatio = window.devicePixelRatio;

  const ctx = canvas.getContext('2d');

  const minTextWidth = textPadding.x + ctx.measureText('\u2026').textWidth;

  const state = {
    devicePixelRatio,
    canvasWidth: window.innerWidth,
    canvasHeight: isFlameChart ? window.innerHeight - header.clientHeight : 50
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
