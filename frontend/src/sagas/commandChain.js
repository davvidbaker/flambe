import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';

import { getTimeline } from 'reducers/timeline';

function* commandChain({ operand, command }) {
  const timeline = yield select(getTimeline);

  console.log('command', command);
  console.log('operand', operand);

  switch (command.action) {
    case 'chain':
      yield command.promise;
    default:
      break;
  }

  yield put({ type: 'DUMMY' });
}

export default commandChain;
