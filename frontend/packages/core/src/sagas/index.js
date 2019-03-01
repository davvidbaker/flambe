import commandSaga from './command';
import networkSaga from './network';
import searchSaga from './search';
import socketSaga from './socket';

import { all, fork } from 'redux-saga/effects';

function* sagas() {
  yield all(
    [networkSaga, commandSaga, socketSaga, searchSaga].map(saga => fork(saga)),
  );
}

export default sagas;
