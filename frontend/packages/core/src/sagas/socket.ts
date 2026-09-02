import { Socket } from 'phoenix';
import { put, takeLatest, select, take, cancelled, delay, race } from 'redux-saga/effects';
import { eventChannel as sagaEventChannel } from 'redux-saga';
import type { EventChannel, SagaIterator } from 'redux-saga';

import { TIMELINE_EVENT_DELETED, TIMELINE_EVENT_RECEIVED } from '../constants/liveEvents';
import { TRACE_FETCH } from '../actions';
import { getTimeline, type TimelineState } from '../reducers/timeline';
import { getUser } from '../reducers/user';
import type { EntityId } from '../types/ids';
import type { TraceEvent } from '../types/TraceEvent';

interface SocketAction {
  type: string;
  [key: string]: unknown;
}

interface TimelineEventPayload {
  event?: Omit<TraceEvent, 'timestamp'> & { timestamp: number | string };
  trace_id?: EntityId;
}

const TRACE_REFRESH_FALLBACK_MS = 2_000;

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
      .receive('ok', () => {
        // Channel delivery is intentionally ephemeral. Re-fetching the current
        // trace after every successful join/rejoin fills any gap that occurred
        // while this browser was disconnected.
        emit({ type: 'EVENTS_CHANNEL_JOINED' });
      })
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
    phoenixChannel.on('timeline_event', (payload: TimelineEventPayload) => {
      const { event, trace_id } = payload;
      if (!event || trace_id === undefined) return;

      const timestamp = typeof event.timestamp === 'number'
        ? event.timestamp
        : new Date(event.timestamp).getTime();

      if (!Number.isFinite(timestamp)) {
        console.error('received timeline event with invalid timestamp', payload);
        return;
      }

      emit({
        type: TIMELINE_EVENT_RECEIVED,
        trace_id,
        event: {
          ...event,
          timestamp,
        },
      });
    });
    phoenixChannel.on('timeline_event_deleted', (payload: { event_id?: EntityId; trace_id?: EntityId }) => {
      if (payload.event_id === undefined || payload.trace_id === undefined) return;
      emit({ type: TIMELINE_EVENT_DELETED, trace_id: payload.trace_id, event_id: payload.event_id });
    });

    return () => {
      phoenixChannel.leave();
      socket.disconnect();
    };
  });

  return socketEventChannel;
}

function* refreshOpenTrace(): SagaIterator {
  const timeline: TimelineState = yield select(getTimeline);
  const trace_id = timeline.trace?.id;
  if (trace_id === null || trace_id === undefined) return;

  yield put({ type: TRACE_FETCH, trace: trace_id });
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
      const { myAction, refresh } = yield race({
        myAction: take(socketEventChannel),
        refresh: delay(TRACE_REFRESH_FALLBACK_MS),
      });

      if (refresh) {
        // The WebSocket is the fast path. Polling the open trace is the
        // reliability path for a stale or silently failed browser socket.
        yield* refreshOpenTrace();
        continue;
      }

      if (!myAction) continue;
      yield put(myAction);

      if (myAction.type === 'EVENTS_CHANNEL_JOINED') {
        yield* refreshOpenTrace();
      }
    }
  } finally {
    if (yield cancelled()) socketEventChannel.close();
  }
}

function* socketSaga(): SagaIterator {
  yield takeLatest('USER_FETCH_SUCCEEDED', initSocket);
}

export default socketSaga;
