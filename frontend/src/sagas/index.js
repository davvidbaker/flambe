import { fork } from 'redux-saga/effects';
import commandSaga from './command';
import networkSaga from './network';
import socketSaga from './socket';

function* sagas() {
  yield [networkSaga, commandSaga, socketSaga].map(saga => fork(saga));
}

export default sagas;
