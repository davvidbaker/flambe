// @flow

export const viewportMatchesTrace = (viewportTraceId, traceId) => (
  viewportTraceId !== null
  && viewportTraceId !== undefined
  && String(viewportTraceId) === String(traceId)
);

export const savedRangeIsUsable = (
  leftBoundaryTime,
  rightBoundaryTime,
  minTime,
  maxTime,
  viewportTraceId,
  traceId,
) => (
  viewportMatchesTrace(viewportTraceId, traceId)
  || (rightBoundaryTime >= minTime && leftBoundaryTime <= maxTime)
);
