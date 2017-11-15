import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import { ACTIVITY_CREATE, createActivity } from 'actions';

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
    default:
      break;
  }
}

export default handleCommand;
