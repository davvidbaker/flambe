import {
  ACTIVITY_DELETE,
  UNDO_LAST_COMMAND,
  clearUndo,
  deleteActivity,
  deleteEvent,
} from '../actions';
import { takeEvery, put, select } from 'redux-saga/effects';
import type { SagaIterator } from 'redux-saga';
import type { UndoTarget } from '../reducers/undo';

function* undoLastCommand(): SagaIterator {
  const target: UndoTarget | null = yield select((state: { undo: UndoTarget | null }) => state.undo);
  if (!target) return;

  // Consume the one-level history before issuing the request so repeated
  // shortcuts cannot delete the same server record twice.
  yield put(clearUndo());

  if (target.kind === 'activity') {
    yield put(deleteActivity(target.id, target.thread_id));
  } else {
    yield put(deleteEvent(target.id));
  }
}

function* clearUndoAfterManualActivityDelete(): SagaIterator {
  yield put(clearUndo());
}

function* undoSaga(): SagaIterator {
  yield takeEvery(UNDO_LAST_COMMAND, undoLastCommand);
  yield takeEvery(ACTIVITY_DELETE, clearUndoAfterManualActivityDelete);
}

export default undoSaga;
