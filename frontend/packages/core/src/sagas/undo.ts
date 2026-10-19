import { UNDO_LAST_COMMAND, REDO_LAST_COMMAND, createToast } from '../actions';
import { takeLeading, put, select, call } from 'redux-saga/effects';
import type { SagaIterator } from 'redux-saga';
import type { RootState } from '../rootReducer';
import { UNDO_POP, REDO_POP, undoScope, type UndoTarget } from '../reducers/undo';
import { performUndo } from './network';

export function* undoLastCommand(action: { type?: string } = {}): SagaIterator {
  const state: RootState = yield select();
  const traceId = state.timeline.trace?.id;
  if (traceId == null || state.user.id == null) return;
  const scope = undoScope(state.user.id, traceId);
  const redoing = action.type === REDO_LAST_COMMAND;
  const initialUndo = state.undo[scope];
  const target = (redoing ? state.redo : state.undo)?.[scope]?.at(-1);
  if (!target) return;
  if (target.kind === 'unsupported') {
    yield put(createToast(`${target.label} cannot be ${redoing ? 'redone' : 'undone'} yet. Earlier changes were left alone.`, 'error'));
    return;
  }
  const inverse: UndoTarget | false = yield call(performUndo, target, traceId);
  if (inverse !== false) {
    const latest: RootState = yield select();
    const transfer = redoing || latest.undo[scope] === initialUndo ? inverse : undefined;
    yield put({ type: redoing ? REDO_POP : UNDO_POP, scope, target, inverse: transfer });
  }
}

export default function* undoSaga(): SagaIterator {
  // One worker serializes both directions; a fast undo/redo cannot race the server.
  yield takeLeading([UNDO_LAST_COMMAND, REDO_LAST_COMMAND], undoLastCommand);
}
