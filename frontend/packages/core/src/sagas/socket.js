import { Socket } from 'phoenix';
import { put, takeEvery, select, take } from 'redux-saga/effects';
import { eventChannel as sagaEventChannel } from 'redux-saga';

import { getUser } from '../reducers/user';

function createSocketChannel(socket, user_id) {
  const socketEventChannel = sagaEventChannel(emit => {
    socket.onOpen(e => {
      emit({ type: 'SOCKET_OPEN' });
      console.log('OPEN', e);
    });
    socket.onError(e => {
      emit({ type: 'SOCKET_ERROR' });
      console.log('ERROR', e);
    });
    socket.onClose(e => {
      emit({ type: 'SOCKET_CLOSE' });
      console.log('CLOSE', e);
    });

    const phoenixChannel = socket.channel(`events:${user_id}`, {});
    phoenixChannel
      .join()
      .receive('ok', ({ messages }) => console.log('catching up', messages))
      .receive('error', ({ reason }) => console.log('failed join', reason))
      .receive('timeout', () =>
        console.log('Networking issue. Still waiting...'));

    phoenixChannel.onError(e => console.log('something went wrong', e));
    phoenixChannel.onClose(e => console.log('channel closed', e));

    phoenixChannel.on('tabs', tabs => {
      emit({ type: 'TABS_EVENT', ...tabs });
    });
    phoenixChannel.on('search_terms', searchTerm => {
      emit({ type: 'SEARCH_TERMS_EVENT', ...searchTerm });
    });
    // subscriber must return unsubscribe method
    const unsubscribe = () => {
      // TODO
    };
    return unsubscribe;
  });

  return socketEventChannel;
}

function* initSocket() {
  const user_id = (yield select(getUser)).id;

  // eslint-disable-next-line no-undef
  const socket = new Socket(`${SOCKET_SERVER}/socket`, {
    params: {
      user_id: 1
    },
    logger: (kind, msg, data) => {
      // console.log(`${kind}: ${msg}`, data);
    }
  });

  socket.connect();

  const socketEventChannel = createSocketChannel(socket, user_id);

  while (true) {
    const myAction = yield take(socketEventChannel);
    yield put(myAction);
  }
}

function* socketSaga() {
  // ⚠️ temporary until I think of a better event to listen on
  yield takeEvery('USER_FETCH_SUCCEEDED', initSocket);
}

export default socketSaga;
