import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import {
  ACTIVITY_CREATE,
  ACTIVITY_END,
  THREAD_CREATE,
  TODOS_TOGGLE,
  createActivity,
  createThread,
  endActivity,
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

    case ACTIVITY_END:
      yield put(endActivity(operand.id, Date.now(), '', operand.thread_id));
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
