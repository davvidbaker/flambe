import type { UndoState } from '../reducers/undo';
const key = 'flambe.undo-history.v2';
function validated(value: unknown): UndoState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([scope, entries]) =>
    /^\d+:\d+$/.test(scope) && Array.isArray(entries) && entries.every(entry =>
      entry && ((entry.kind === 'unsupported' && typeof entry.label === 'string')
        || ((entry.kind === 'move' || entry.kind === 'creation') && typeof entry.token === 'string' && entry.trace_id != null)
        || (entry.kind === 'event' && entry.id != null)
        || (entry.kind === 'activity' && entry.id != null && entry.thread_id != null)),
    ),
  ).map(([scope, entries]) => [scope, (entries as unknown[]).slice(-100)])) as UndoState;
}
function load(): { undo: UndoState; redo: UndoState } {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return { undo: validated(JSON.parse(localStorage.getItem('flambe.undo-history.v1') ?? '{}')), redo: {} };
    const value = JSON.parse(saved);
    return { undo: validated(value?.undo), redo: validated(value?.redo) };
  } catch { return { undo: {}, redo: {} }; }
}
export const loadUndoHistory = () => load().undo;
export const loadRedoHistory = () => load().redo;
export function saveUndoHistory(undo: UndoState, redo: UndoState = {}): void {
  try { localStorage.setItem(key, JSON.stringify({ undo, redo })); } catch { /* Storage may be unavailable. */ }
}
