import { Socket } from 'phoenix';
import { put, takeLatest, select, take, cancelled } from 'redux-saga/effects';
import { eventChannel as sagaEventChannel } from 'redux-saga';

import { getUser } from '../reducers/user';

function createSocketChannel(socket, user_id) {
  const socketEventChannel = sagaEventChannel(emit => {
    socket.onOpen(() => {
      emit({ type: 'SOCKET_OPEN' });
    });
    socket.onError(() => {
      emit({ type: 'SOCKET_ERROR' });
    });
    socket.onClose(() => {
      emit({ type: 'SOCKET_CLOSE' });
    });

    const phoenixChannel = socket.channel(`events:${user_id}`, {});
    phoenixChannel
      .join()
      .receive('ok', () => {})
      .receive('error', () => {})
      .receive('timeout', () => {});

    phoenixChannel.onError(() => {});
    phoenixChannel.onClose(() => {});

    phoenixChannel.on('tabs', tabs => {
      emit({ type: 'TABS_EVENT', ...tabs });
    });
    phoenixChannel.on('search_terms', searchTerm => {
      emit({ type: 'SEARCH_TERMS_EVENT', ...searchTerm });
    });
    return () => {
      phoenixChannel.leave();
      socket.disconnect();
    };
  });

  return socketEventChannel;
}

function* initSocket() {
  const user_id = (yield select(getUser)).id;

  // eslint-disable-next-line no-undef
  const socket = new Socket(`${SOCKET_SERVER}/socket`, {
    // The legacy socket still reads this during the migration. Phoenix 1.8
    // authenticates from the signed session instead, so it safely ignores it.
    params: { user_id },
    logger: (kind, msg, data) => {
      // console.log(`${kind}: ${msg}`, data);
    }
  });

  const socketEventChannel = createSocketChannel(socket, user_id);
  socket.connect();

  try {
    while (true) {
      const myAction = yield take(socketEventChannel);
      yield put(myAction);
    }
  } finally {
    if (yield cancelled()) socketEventChannel.close();
  }
}

function* socketSaga() {
  yield takeLatest('USER_FETCH_SUCCEEDED', initSocket);
}

export default socketSaga;
