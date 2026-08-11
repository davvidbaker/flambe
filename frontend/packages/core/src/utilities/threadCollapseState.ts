import type { EntityId } from '../types/ids';

const STORAGE_KEY = 'flambe.thread-collapse-state.v1';

type CollapsibleThread = {
  collapsed?: boolean;
};

type CollapsedThreadState = Record<string, boolean>;
type StoredCollapseState = Record<string, CollapsedThreadState>;

function readAll(): StoredCollapseState {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : {};

    return parsed && typeof parsed === 'object'
      ? parsed as StoredCollapseState
      : {};
  } catch (_error) {
    return {};
  }
}

export function getCollapsedThreadState(traceId: EntityId | null | undefined): CollapsedThreadState {
  if (!traceId) return {};
  return readAll()[traceId] || {};
}

export function persistCollapsedThreadState(
  traceId: EntityId | null | undefined,
  threads: Record<string, CollapsibleThread> | CollapsibleThread[] | null | undefined,
): void {
  if (!traceId || !threads || Object.keys(threads).length === 0) return;

  const allTraces = readAll();
  const collapsedThreads = Object.entries(threads).reduce<CollapsedThreadState>(
    (result, [id, thread]) => ({
      ...result,
      [id]: Boolean(thread.collapsed),
    }),
    {},
  );

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...allTraces, [traceId]: collapsedThreads }),
    );
  } catch (_error) {
    // The trace remains usable when browser storage is unavailable.
  }
}
