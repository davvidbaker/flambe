import { Socket } from 'phoenix';
import { put, takeEvery, select } from 'redux-saga/effects';

import { getUser } from '../reducers/user';

function* initSocket() {
  const socket = new Socket(`${SOCKET_SERVER}/socket`, {
    params: {
      user_id: 1
    },
    logger: (kind, msg, data) => {
      console.log(`${kind}: ${msg}`, data);
    }
  });

  socket.connect();

  /* ⚠️ these are not working (look at box man) */
  socket.onOpen(function* (e) {
    yield put('SOCKET_OPEN');
    console.log('OPEN', e);
  });
  socket.onError(function* (e) {
    yield put('SOCKET_ERROR');
    console.log('ERROR', e);
  });
  socket.onClose(function* (e) {
    yield put('SOCKET_CLOSE');
    console.log('CLOSE', e);
  });

  const user_id = (yield select(getUser)).id;

  const channel = socket.channel(`events:${user_id}`, {});
  channel
    .join()
    .receive('ok', ({ messages }) => console.log('catching up', messages))
    .receive('error', ({ reason }) => console.log('failed join', reason))
    .receive('timeout', () =>
      console.log('Networking issue. Still waiting...')
    );

  channel.onError(e => console.log('something went wrong', e));
  channel.onClose(e => console.log('channel closed', e));

  channel.on('new:msg', msg => {
    console.log('msg', msg);
  });
}

function* socketSaga() {
  // ⚠️ temporary until I think of a better event to listen on
  yield takeEvery('USER_FETCH_SUCCEEDED', initSocket);
}

export default socketSaga;
