const STORAGE_KEY = 'flambe.thread-collapse-state.v1';

function readAll() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
  } catch (_error) {
    return {};
  }
}

export function getCollapsedThreadState(traceId) {
  if (!traceId) return {};
  return readAll()[traceId] || {};
}

export function persistCollapsedThreadState(traceId, threads) {
  if (!traceId || !threads || Object.keys(threads).length === 0) return;

  const allTraces = readAll();
  const collapsedThreads = Object.entries(threads).reduce(
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
