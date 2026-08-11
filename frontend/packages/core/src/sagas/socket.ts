import { Socket } from 'phoenix';
import { put, takeLatest, select, take, cancelled } from 'redux-saga/effects';
import { eventChannel as sagaEventChannel } from 'redux-saga';
import type { EventChannel, SagaIterator } from 'redux-saga';

import { getUser } from '../reducers/user';
import type { EntityId } from '../types/ids';

interface SocketAction {
  type: string;
  [key: string]: unknown;
}

function createSocketChannel(socket: Socket, user_id: EntityId): EventChannel<SocketAction> {
  const socketEventChannel = sagaEventChannel<SocketAction>(emit => {
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

    phoenixChannel.on('tabs', (tabs: Record<string, unknown>) => {
      emit({ type: 'TABS_EVENT', ...tabs });
    });
    phoenixChannel.on('search_terms', (searchTerm: Record<string, unknown>) => {
      emit({ type: 'SEARCH_TERMS_EVENT', ...searchTerm });
    });
    return () => {
      phoenixChannel.leave();
      socket.disconnect();
    };
  });

  return socketEventChannel;
}

function* initSocket(): SagaIterator {
  const user_id = (yield select(getUser)).id;

  // eslint-disable-next-line no-undef
  const socket = new Socket(`${SOCKET_SERVER}/socket`, {
    // The legacy socket still reads this during the migration. Phoenix 1.8
    // authenticates from the signed session instead, so it safely ignores it.
    params: { user_id },
    logger: (_kind: string, _msg: string, _data: unknown) => {
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

function* socketSaga(): SagaIterator {
  yield takeLatest('USER_FETCH_SUCCEEDED', initSocket);
}

export default socketSaga;
