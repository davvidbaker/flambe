import type { EntityId } from '../types/ids';

export const viewportMatchesTrace = (
  viewportTraceId: EntityId | null | undefined,
  traceId: EntityId,
): boolean => (
  viewportTraceId !== null
  && viewportTraceId !== undefined
  && String(viewportTraceId) === String(traceId)
);

export const savedRangeIsUsable = (
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  minTime: number,
  maxTime: number,
  viewportTraceId: EntityId | null | undefined,
  traceId: EntityId,
): boolean => (
  viewportMatchesTrace(viewportTraceId, traceId)
  || (rightBoundaryTime >= minTime && leftBoundaryTime <= maxTime)
);
