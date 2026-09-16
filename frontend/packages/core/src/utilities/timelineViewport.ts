import type { EntityId } from '../types/ids';

export const LEFT_BOUNDARY_STORAGE_KEY = 'lbt';
export const RIGHT_BOUNDARY_STORAGE_KEY = 'rbt';
export const VIEWPORT_TRACE_STORAGE_KEY = 'flambe.timeline.viewport-trace-id.v1';

export type SavedTimelineViewport = {
  leftBoundaryTime: number;
  rightBoundaryTime: number;
};

export function readSavedTimelineViewport(): SavedTimelineViewport | null {
  if (typeof window === 'undefined') return null;
  const left = Number(window.localStorage.getItem(LEFT_BOUNDARY_STORAGE_KEY));
  const right = Number(window.localStorage.getItem(RIGHT_BOUNDARY_STORAGE_KEY));
  if (!Number.isFinite(left) || !Number.isFinite(right) || right <= left) return null;
  return { leftBoundaryTime: left, rightBoundaryTime: right };
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function toDatetimeLocalValue(ms: number): string {
  const date = new Date(ms);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

export function fromDatetimeLocalValue(value: string): number | null {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

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
