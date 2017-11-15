import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import {
  ACTIVITY_CREATE,
  THREAD_CREATE,
  createActivity,
  createThread,
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
          // category_id: command.category_id
        }),
      );
      break;

    case THREAD_CREATE:
      const timeline = yield select(getTimeline);
      const rank = timeline.threads.length;
      console.log('timeline, rank', timeline, rank);
      yield put(createThread(command.name, rank));
      break;

    default:
      break;
  }
}

export default handleCommand;
