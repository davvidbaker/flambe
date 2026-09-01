import { Socket } from 'phoenix';
import { eventChannel, type EventChannel } from 'redux-saga';
import { call, fork, put, take, takeEvery } from 'redux-saga/effects';
import type { SagaIterator } from 'redux-saga';

import { TIMELINE_EVENT_RECEIVED } from '../constants/liveEvents';
import type { EntityId } from '../types/ids';
import type { TraceEvent } from '../types/TraceEvent';

interface UserFetchAction {
  data?: { id?: number };
  type: string;
}

interface TimelineEventPayload {
  event?: Omit<TraceEvent, 'timestamp'> & { timestamp: number | string };
  trace_id?: EntityId;
}

function createSocketChannel(userId: number): EventChannel<Record<string, unknown>> {
  return eventChannel(emit => {
    const socket = new Socket('/socket');
    socket.connect();

    const phoenixChannel = socket.channel(`events:${userId}`, {});
    phoenixChannel.onMessage = (eventName, payload) => {
      if (eventName === 'timeline_event') {
        const { event, trace_id } = payload as TimelineEventPayload;
        if (!event || trace_id === undefined) return payload;

        const timestamp = typeof event.timestamp === 'number'
          ? event.timestamp
          : new Date(event.timestamp).getTime();

        if (!Number.isFinite(timestamp)) {
          console.error('received timeline event with invalid timestamp', payload);
          return payload;
        }

        emit({
          type: TIMELINE_EVENT_RECEIVED,
          trace_id,
          event: {
            ...event,
            timestamp,
          },
        });
      } else if (eventName !== 'phx_reply') {
        emit({
          type: eventName,
          ...(payload as Record<string, unknown>),
        });
      }
      return payload;
    };

    phoenixChannel
      .join()
      .receive('ok', () => {
        console.log(`joined events:${userId}`);
      })
      .receive('error', response => {
        console.log('events channel join failed', response);
      });

    return () => {
      void phoenixChannel.leave();
      socket.disconnect();
    };
  });
}

function* watchSocket(channel: EventChannel<Record<string, unknown>>): SagaIterator {
  while (true) {
    const action: Record<string, unknown> = yield take(channel);
    yield put(action);
  }
}

function* connectSocket({ data }: UserFetchAction): SagaIterator {
  if (!data?.id) return;
  const channel: EventChannel<Record<string, unknown>> = yield call(createSocketChannel, data.id);
  yield fork(watchSocket, channel);
}

export default function* socketSaga(): SagaIterator {
  yield takeEvery('USER_FETCH_SUCCEEDED', connectSocket);
}
