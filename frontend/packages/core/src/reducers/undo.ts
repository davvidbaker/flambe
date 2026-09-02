import {
  TRACE_SELECT,
  UNDO_CLEAR,
  UNDO_RECORD,
} from '../actions';
import type { EntityId } from '../types/ids';

export type UndoTarget =
  | { kind: 'activity'; id: EntityId; thread_id: EntityId }
  | { kind: 'event'; id: EntityId };

interface UndoAction {
  target?: UndoTarget;
  type: string;
}

export default function undo(
  state: UndoTarget | null = null,
  action: UndoAction,
): UndoTarget | null {
  switch (action.type) {
    case UNDO_RECORD:
      return action.target ?? state;
    case UNDO_CLEAR:
    case TRACE_SELECT:
      return null;
    default:
      return state;
  }
}
