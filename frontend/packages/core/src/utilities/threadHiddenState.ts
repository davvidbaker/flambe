import type { EntityId } from '../types/ids';

const STORAGE_KEY = 'flambe.thread-hidden-state.v1';

type HiddenThreadState = Record<string, EntityId[]>;

function readAll(): HiddenThreadState {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : {};

    return parsed && typeof parsed === 'object'
      ? parsed as HiddenThreadState
      : {};
  } catch (_error) {
    return {};
  }
}

function normalizeIds(ids: unknown): EntityId[] {
  if (!Array.isArray(ids)) return [];
  return ids
    .map(id => Number(id))
    .filter(id => Number.isFinite(id) && id > 0);
}

export function getHiddenThreadIds(traceId: EntityId | null | undefined): EntityId[] {
  if (!traceId) return [];
  return normalizeIds(readAll()[String(traceId)]);
}

export function persistHiddenThreadIds(
  traceId: EntityId | null | undefined,
  hiddenIds: EntityId[] | null | undefined,
): void {
  if (!traceId) return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...readAll(), [String(traceId)]: normalizeIds(hiddenIds) }),
    );
  } catch (_error) {
    // The trace remains usable when browser storage is unavailable.
  }
}
