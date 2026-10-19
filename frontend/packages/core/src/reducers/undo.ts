import { UNDO_CLEAR, UNDO_RECORD } from '../actions';
import type { EntityId } from '../types/ids';

export type UndoTarget =
  | { kind: 'activity'; id: EntityId; thread_id: EntityId }
  | { kind: 'event'; id: EntityId; restoreWeight?: { activity_id: EntityId; weight: number | null } }
  | { kind: 'unsupported'; label: string }
  | { kind: 'move'; token: string; trace_id: EntityId }
  | { kind: 'creation'; token: string; trace_id: EntityId };
export type UndoState = Record<string, UndoTarget[]>;
export const UNDO_POP = 'UNDO_POP';
export const REDO_POP = 'REDO_POP';
export const undoScope = (userId: EntityId, traceId: EntityId) => `${userId}:${traceId}`;

interface UndoAction { target?: UndoTarget; inverse?: UndoTarget; scope?: string; type: string }
export default function undo(state: UndoState = {}, action: UndoAction): UndoState {
  if (action.type === UNDO_CLEAR) return action.scope ? { ...state, [action.scope]: [] } : {};
  if (!action.scope) return state;
  const entries = state[action.scope] ?? [];
  if (action.type === UNDO_RECORD && action.target) {
    return { ...state, [action.scope]: [...entries, action.target].slice(-100) };
  }
  if (action.type === REDO_POP && action.inverse) {
    return { ...state, [action.scope]: [...entries, action.inverse].slice(-100) };
  }
  if (action.type === UNDO_POP) {
    return { ...state, [action.scope]: entries.filter(entry => entry !== action.target) };
  }
  return state;
}

export function redo(state: UndoState = {}, action: UndoAction): UndoState {
  if (action.type === UNDO_CLEAR) return action.scope ? { ...state, [action.scope]: [] } : {};
  if (!action.scope) return state;
  if (action.type === UNDO_RECORD) return { ...state, [action.scope]: [] };
  const entries = state[action.scope] ?? [];
  if (action.type === UNDO_POP && action.inverse) {
    return { ...state, [action.scope]: [...entries, action.inverse].slice(-100) };
  }
  if (action.type === REDO_POP) {
    return { ...state, [action.scope]: entries.filter(entry => entry !== action.target) };
  }
  return state;
}
