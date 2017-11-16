import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import {
  ACTIVITY_CREATE,
  ACTIVITY_DELETE,
  ACTIVITY_END,
  ACTIVITY_REJECT,
  ACTIVITY_RESOLVE,
  ACTIVITY_RESUME,
  ACTIVITY_SUSPEND,
  THREAD_CREATE,
  TODOS_TOGGLE,
  createActivity,
  createThread,
  deleteActivity,
  endActivity,
  resumeActivity,
  suspendActivity,
  toggleTodos,
} from 'actions';

import { getTimeline } from 'reducers/timeline';

function* handleCommand({ type, operand, command }) {
  switch (command.action) {
    case ACTIVITY_CREATE:
      yield put(
        createActivity({
          name: command.name,
          timestamp: Date.now(),
          description: '',
          thread_id: command.thread_id,
          phase: command.copy.includes('question') ? 'Q' : 'B',
          // category_id: command.category_id
        }),
      );
      break;

    case ACTIVITY_RESUME:
      yield put(
        resumeActivity({
          id: operand.activity_id,
          timestamp: Date.now(),
          message: command.message,
          thread_id: command.thread_id,
        }),
      );
      break;

    case ACTIVITY_END:
    case ACTIVITY_REJECT:
    case ACTIVITY_RESOLVE:
      const message = command.message ? command.message : '';
      const eventFlavor = command.action.includes('REJECT')
        ? 'J'
        : command.action.includes('RESOLVE') ? 'V' : 'E';
      yield put(
        endActivity({
          id: operand.activity_id,
          timestamp: Date.now(),
          message,
          thread_id: operand.thread_id,
          eventFlavor,
        }),
      );
      break;

    case ACTIVITY_DELETE:
      yield put(deleteActivity(operand.activity_id, operand.thread_id));
      break;
    /** 💁 if this isn't obvious, suspension can only happen on the most recent block of an activity (for activities that may have been suspended and resumed already) */
    case ACTIVITY_SUSPEND:
      yield put(
        suspendActivity({
          id: operand.activity_id,
          timestamp: Date.now(),
          message: command.message ? command.message : '',
          thread_id: operand.thread_id,
        }),
      );
      break;

    case THREAD_CREATE:
      const timeline = yield select(getTimeline);
      const rank = timeline.threads.length;
      console.log('timeline, rank', timeline, rank);
      yield put(createThread(command.name, rank));
      break;

    case TODOS_TOGGLE:
      const todosVisible = yield select(state => state.todosVisible);
      yield put(toggleTodos(!todosVisible));
      break;

    default:
      break;
  }
}

export default handleCommand;
