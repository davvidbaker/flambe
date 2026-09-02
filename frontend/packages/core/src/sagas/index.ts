import commandSaga from './command';
import networkSaga from './network';
import searchSaga from './search';
import socketSaga from './socket';
import undoSaga from './undo';

import { all, fork } from 'redux-saga/effects';
import type { SagaIterator } from 'redux-saga';

function* sagas(): SagaIterator {
  yield all(
    [networkSaga, commandSaga, socketSaga, searchSaga, undoSaga].map(saga => fork(saga)),
  );
}

export default sagas;
