/* ⚠️ TODO topBoundaryTime and leftBoundaryTime in timelineChart are the same thing and should be refactored to not take horizontal/vertical into account, etc */

export function getBlockX(offsetFromLeft) {
  return offsetFromLeft;
}

export function timeToPixels(
  timestamp: number,
  topBoundaryTime: number,
  bottomBoundaryTime: number,
  canvasHeight: number
) {
  return (
    ((timestamp - topBoundaryTime) * canvasHeight) /
    (bottomBoundaryTime - topBoundaryTime)
  );
}

export function getBlockTransform(
  startTime: number,
  endTime: number,
  topBoundaryTime: number,
  bottomBoundaryTime: number,
  blockWidth: number,
  offsetFromLeft: number,
  canvasWidth: number,
  canvasHeight: number
): { blockX: number, blockY: number, blockHeight: number } {
  if (endTime == null) {
    // eslint-disable-next-line no-param-reassign
    endTime = bottomBoundaryTime;
  }

  const blockY = timeToPixels(
    startTime > topBoundaryTime ? startTime : topBoundaryTime,
    topBoundaryTime,
    bottomBoundaryTime,
    canvasWidth
  );
  const blockX = getBlockX(offsetFromLeft);
  const blockHeight =
    timeToPixels(endTime, topBoundaryTime, bottomBoundaryTime, canvasHeight) -
    blockY;

  return { blockX, blockY, blockHeight };
}
