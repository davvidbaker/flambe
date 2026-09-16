import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';

import {
  createToast,
  recordUndo,
  processTimelineTrace,
  setHiddenThreads,
  updateActivity as updateActivityAction,
  ACTIVITY_CREATE_B,
  ACTIVITY_CREATE_Q,
  ACTIVITY_DELETE,
  ACTIVITY_END,
  ACTIVITY_RESUME,
  ACTIVITY_RESURRECT,
  ACTIVITY_SUSPEND,
  ACTIVITY_UPDATE,
  ATTENTION_SHIFT,
  CATEGORY_CREATE,
  CATEGORY_UPDATE,
  EVENT_UPDATE,
  EVENT_DELETE,
  MANTRA_CREATE,
  THREAD_CREATE,
  THREAD_DELETE,
  THREAD_UPDATE,
  THREAD_HIDE,
  THREADS_REORDER,
  TODO_CREATE,
  TODO_BEGIN,
  TRACE_CREATE,
  TRACE_FETCH,
  TRACE_FILTER,
  TRACE_SELECT,
  TRACE_DELETE,
  USER_FETCH,
  USER_SETTINGS_UPDATE,
  SETTING_TOGGLE,
} from '../actions';
import { getUser, type UserState } from '../reducers/user';
import { isUserSettingKey, type SettingsState } from '../reducers/settings';
import { getTimeline, type TimelineState } from '../reducers/timeline';
import { getCollapsedThreadState } from '../utilities/threadCollapseState';
import { getHiddenThreadIds, persistHiddenThreadIds } from '../utilities/threadHiddenState';
import { navigate } from '../utilities/navigation';
import type { SagaIterator } from 'redux-saga';
import type { EntityId } from '../types/ids';
import type { EventPhase, TraceEvent } from '../types/TraceEvent';
import type { Thread } from '../types/Thread';
import type { Trace } from '../types/Trace';

interface Resource {
  id?: EntityId;
  path: string;
}

interface ResourceRequest {
  params?: RequestInit;
  resource: Resource;
}

interface NetworkResponse {
  data: unknown;
}

interface IncomingTrace {
  events: Array<Omit<TraceEvent, 'timestamp'> & { timestamp: number | string }>;
  id: EntityId;
  threads: Thread[];
}

interface NetworkAction {
  activity_id?: EntityId;
  category_id?: EntityId | null;
  color_background?: string;
  color_text?: string;
  data?: IncomingTrace;
  description?: string | null;
  eventFlavor?: EventPhase;
  id?: EntityId;
  message?: string;
  name?: string;
  orderedIds?: EntityId[];
  phase?: EventPhase;
  rank?: number;
  thread_id?: EntityId;
  timestamp?: number;
  todo_id?: EntityId | null;
  trace?: Trace | EntityId;
  type: string;
  updates?: Record<string, unknown>;
  weight?: number;
}

async function hitNetwork({ resource, params = {} }: ResourceRequest): Promise<NetworkResponse> {
  const response = await fetch(
    params.method === 'POST'
      ? `${SERVER}/api/${resource.path}`
      : `${SERVER}/api/${resource.path}/${resource.id}`,
    {
      headers: {
        'content-type': 'application/json',
      },
      credentials: 'include',
      ...params,
    },
  );
  if (!response.ok) throw response;
  if (response.status === 204) return { data: null };
  return response.json() as Promise<NetworkResponse>;
}

/** 💁 I tried doing an async generator but was running into call stack exceptions and it seemed to be swallowing put errors. Using Redux-Saga `call works instead */
function* fetchResource(actionType: string, { resource, params }: ResourceRequest): SagaIterator {
  // action should be {resourceType, resourceIdentifier}
  try {
    const json: NetworkResponse = yield call(hitNetwork, { resource, params });
    const { data } = json;
    yield put({ type: `${actionType}_SUCCEEDED`, data });
    return data;
  } catch (error: unknown) {
    if (error instanceof Response && error.status === 401) {
      yield call(navigate, '/login');
      return;
    }
    console.error(`network error`, error);
    yield put(
      createToast(
        `${actionType.replace(/_/g, ' ')} failed. Network error.
      
      See Network panel in DevTools for details.`,
        'error',
      ),
    );
  }
}

// // // // // // // // // // // // // // // // // // // // // // // //

/** 💁 Creating an activity from a todo automatically handles deleting that todo (from the database). */
function* createActivity({
  type,
  name,
  timestamp,
  description, // 👈 not currently using this
  thread_id /* message */,
  category_id,
  todo_id = null,
  phase = 'B',
}: NetworkAction): SagaIterator {
  const timeline: TimelineState = yield select(getTimeline);

  const data = yield* fetchResource(type, {
    resource: { path: 'activities' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        trace_id: timeline.trace?.id,
        thread_id,
        todo_id,
        event: { timestamp_integer: timestamp, phase },
        activity: {
          name,
          description,
          categories: category_id ? [category_id] : [],
        },
      }),
    },
  });
  if (data?.activity?.id !== undefined) {
    yield put(recordUndo({ kind: 'activity', id: data.activity.id, thread_id }));
  }
}

function* endActivity({ type, id, timestamp, message, eventFlavor = 'E' }: NetworkAction): SagaIterator {
  const timeline: TimelineState = yield select(getTimeline);
  const data = yield* fetchResource(type, {
    /** 💁 path of 'events' is not a mistake */
    resource: { path: 'events' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        trace_id: timeline.trace?.id,
        activity_id: id,
        event: {
          timestamp_integer: timestamp,
          message,
          phase: eventFlavor,
        },
      }),
    },
  });
  if (data?.id !== undefined) yield put(recordUndo({ kind: 'event', id: data.id }));
}

function* suspendActivity({ type, id, timestamp, message, weight }: NetworkAction): SagaIterator {
  const timeline: TimelineState = yield select(getTimeline);
  const data = yield* fetchResource(type, {
    /** 💁 path of 'events' is not a mistake */
    resource: { path: 'events' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        trace_id: timeline.trace?.id,
        activity_id: id,
        event: {
          timestamp_integer: timestamp,
          message,
          phase: 'S',
        },
      }),
    },
  });

  if (data?.id !== undefined) yield put(recordUndo({ kind: 'event', id: data.id }));

  if (weight && id !== undefined) {
    yield put(updateActivityAction(id, { weight }));
  }
}

// 🔮 if you don't want to delete the events along with the activity, make changes here
function* deleteActivity({ type, id }: NetworkAction): SagaIterator {
  yield* fetchResource(type, {
    resource: { path: 'activities', id },
    params: {
      method: 'DELETE',
      body: JSON.stringify({
        delete_events: true,
      }),
    },
  });
}

// { name, thread_id, category_ids = [], weight }
function* updateActivity({ type, id, updates }: NetworkAction): SagaIterator {
  yield* fetchResource(type, {
    resource: { path: 'activities', id },
    params: {
      method: 'PUT',
      body: JSON.stringify({ activity: { ...updates } }),
    },
  });

  // Thread moves cascade on the server; refetch so blocks/lanes recompute.
  if (updates?.thread_id !== undefined) {
    const timeline: TimelineState = yield select(getTimeline);
    if (timeline.trace?.id !== null && timeline.trace?.id !== undefined) {
      yield* fetchTrace({ type: TRACE_FETCH, trace: timeline.trace.id });
    }
  }
}

function* updateEvent({ type, id, updates }: NetworkAction): SagaIterator {
  yield* fetchResource(type, {
    resource: { path: 'events', id },
    params: {
      method: 'PUT',
      body: JSON.stringify({ event: { ...updates } }),
    },
  });

  const timeline: TimelineState = yield select(getTimeline);
  const trace = timeline.trace;
  /* ⚠️ This is bad. Shouldn't need to use the network!! */
  if (trace && trace.id !== null) yield* fetchTrace({ type: TRACE_FETCH, trace: trace.id });
}

function* deleteEvent({ type, id }: NetworkAction): SagaIterator {
  if (id === undefined) return;
  const timeline: TimelineState = yield select(getTimeline);
  const data = yield* fetchResource(type, {
    resource: { path: 'events', id },
    params: { method: 'DELETE' },
  });

  if (data !== undefined && timeline.trace?.id !== null && timeline.trace?.id !== undefined) {
    yield* fetchTrace({ type: TRACE_FETCH, trace: timeline.trace.id });
  }
}

function* createCategory({ type, activity_id, name, color_background, color_text }: NetworkAction): SagaIterator {
  const user: UserState = yield select(getUser);
  yield* fetchResource(type, {
    resource: { path: 'categories' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        activity_ids: activity_id == null ? [] : [activity_id],
        category: {
          name,
          color_background,
          color_text: color_text ?? '#000000',
        },
      }),
    },
  });
}

function* createTodo({ type, name, description }: NetworkAction): SagaIterator {
  const user: UserState = yield select(getUser);
  yield* fetchResource(type, {
    resource: { path: 'todos' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        todo: {
          name,
          description,
        },
      }),
    },
  });
}

function* updateCategory({ type, id, updates }: NetworkAction): SagaIterator {
  yield* fetchResource(type, {
    resource: { path: 'categories', id },
    params: {
      method: 'PUT',
      body: JSON.stringify({
        category: { ...updates },
      }),
    },
  });
}

function* createMantra({ type, name }: NetworkAction): SagaIterator {
  const user: UserState = yield select(getUser);
  yield* fetchResource(type, {
    resource: { path: 'mantras' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        mantra: {
          name,
          timestamp_integer: Date.now(),
        },
      }),
    },
  });
}

function* shiftAttention({ type, thread_id, timestamp }: NetworkAction): SagaIterator {
  const user: UserState = yield select(getUser);
  yield* fetchResource(type, {
    resource: { path: 'attentions' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        attention: {
          thread_id,
          timestamp_integer: timestamp,
        },
      }),
    },
  });
}

function* updateThread({ type, id, updates }: NetworkAction): SagaIterator {
  yield* fetchResource(type, {
    resource: { path: 'threads', id },
    params: {
      method: 'PUT',
      body: JSON.stringify({
        thread: { ...updates },
      }),
    },
  });
}

function* persistHiddenThreads(): SagaIterator {
  const timeline: TimelineState = yield select(getTimeline);
  persistHiddenThreadIds(timeline.trace?.id, timeline.trace?.filterExcludes ?? []);
}

function* reorderThreads({ type, orderedIds }: NetworkAction): SagaIterator {
  const timeline: TimelineState = yield select(getTimeline);
  const traceId = timeline.trace?.id;
  if (!traceId || !orderedIds) return;

  yield* fetchResource(type, {
    resource: { path: 'traces', id: `${traceId}/thread_order` },
    params: {
      method: 'PUT',
      body: JSON.stringify({ thread_ids: orderedIds }),
    },
  });
}

function* deleteThread({ type, id }: NetworkAction): SagaIterator {
  yield* fetchResource(type, {
    resource: { path: 'threads', id },
    params: {
      method: 'DELETE',
    },
  });
}

function* createTrace({ type, name }: NetworkAction): SagaIterator {
  const user: UserState = yield select(getUser);
  yield* fetchResource(type, {
    resource: { path: 'traces' },
    params: {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, trace: { name } }),
    },
  });
}

function* persistUserSettings(settings: Partial<Pick<SettingsState, 'rightAlignTimelineText'>>): SagaIterator {
  const user: UserState = yield select(getUser);
  if (user.id === undefined || user.id === null) return;
  yield* fetchResource(USER_SETTINGS_UPDATE, {
    resource: { path: 'users', id: user.id },
    params: {
      method: 'PUT',
      body: JSON.stringify({ user: { settings } }),
    },
  });
}

function* persistUserSetting({ setting }: NetworkAction & { setting?: string }): SagaIterator {
  if (!setting || !isUserSettingKey(setting)) return;
  const value: boolean = yield select(
    (state: { settings: SettingsState }) => state.settings[setting],
  );
  yield* persistUserSettings({ [setting]: value });
}

function* fetchUser({ type, id }: NetworkAction): SagaIterator {
  const data = yield* fetchResource(type, {
    resource: { path: 'users', id },
  });
  if (!data || typeof data !== 'object') return;
  const remote = (data as { settings?: { rightAlignTimelineText?: unknown } }).settings
    ?.rightAlignTimelineText;
  if (typeof remote === 'boolean') return;
  const local: boolean = yield select(
    (state: { settings: SettingsState }) => state.settings.rightAlignTimelineText,
  );
  if (local) {
    yield* persistUserSettings({ rightAlignTimelineText: true });
  }
}

function* fetchTrace({ trace }: NetworkAction): SagaIterator {
  if (trace === undefined) return;
  yield* fetchResource(TRACE_FETCH, {
    resource: { path: 'traces', id: typeof trace === 'object' ? trace.id : trace },
  });
}

function* deleteTrace({ type, id }: NetworkAction): SagaIterator {
  yield* fetchResource(type, {
    resource: { path: 'traces', id },
    params: {
      method: 'DELETE',
    },
  });
}

function isCollapsed(persistedThreads: Record<string, Thread>, thread: Thread): boolean {
  if (!persistedThreads) return false;

  const found = persistedThreads[String(thread.id)];
  if (found) {
    return Boolean(found.collapsed);
  }
  return false;
}

function* processFetchedTrace({ data }: NetworkAction): SagaIterator {
  if (!data) return;
  const timeline: TimelineState = yield select(getTimeline);
  const persistedThreads = timeline.threads;
  const persistedCollapseState = getCollapsedThreadState(data.id);

  yield put(
    processTimelineTrace(
      data.events.map(event => ({
        ...event,
        timestamp: new Date(event.timestamp).getTime(),
      })),
      data.threads.map(thread => ({
        ...thread,
        collapsed: isCollapsed(persistedThreads, thread)
          || persistedCollapseState[String(thread.id)] === true,
      })),
    ),
  );
  yield put(setHiddenThreads(getHiddenThreadIds(data.id)));
}

function* createThread({ type, name, rank }: NetworkAction): SagaIterator {
  const timeline: TimelineState = yield select(getTimeline);
  yield* fetchResource(type, {
    resource: { path: 'threads' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        trace_id: timeline.trace?.id,
        thread: { name, rank },
      }),
    },
  });
}

/* ⚠️ Soooo resumeActivity and resurrectActivity are almost identical. Some refactoring is in ofder. */
function* resumeActivity({ type, id, timestamp, message }: NetworkAction): SagaIterator {
  const timeline: TimelineState = yield select(getTimeline);
  const data = yield* fetchResource(type, {
    /** 💁 path of 'events' is not a mistake */
    resource: { path: 'events' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        trace_id: timeline.trace?.id,
        activity_id: id,
        event: {
          timestamp_integer: timestamp,
          message,
          phase: 'R',
        },
      }),
    },
  });
  if (data?.id !== undefined) yield put(recordUndo({ kind: 'event', id: data.id }));
}

function* resurrectActivity({ type, id, timestamp, message }: NetworkAction): SagaIterator {
  const timeline: TimelineState = yield select(getTimeline);
  const data = yield* fetchResource(type, {
    /** 💁 path of 'events' is not a mistake */
    resource: { path: 'events' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        trace_id: timeline.trace?.id,
        activity_id: id,
        event: {
          timestamp_integer: timestamp,
          message,
          phase: 'X',
        },
      }),
    },
  });
  if (data?.id !== undefined) yield put(recordUndo({ kind: 'event', id: data.id }));
}
// // // // // // // // // // // // // // // // // // // // // // // //

function* networkSaga(): SagaIterator {
  yield takeEvery(ACTIVITY_CREATE_B, createActivity);
  yield takeEvery(ACTIVITY_CREATE_Q, createActivity);
  yield takeEvery(ACTIVITY_DELETE, deleteActivity);
  yield takeEvery(ACTIVITY_END, endActivity);
  yield takeEvery(ACTIVITY_RESUME, resumeActivity);
  yield takeEvery(ACTIVITY_RESURRECT, resurrectActivity);
  yield takeEvery(ACTIVITY_SUSPEND, suspendActivity);
  yield takeEvery(ACTIVITY_UPDATE, updateActivity);

  yield takeEvery(CATEGORY_CREATE, createCategory);
  yield takeEvery(CATEGORY_UPDATE, updateCategory);

  yield takeEvery(EVENT_UPDATE, updateEvent);
  yield takeEvery(EVENT_DELETE, deleteEvent);

  yield takeEvery(MANTRA_CREATE, createMantra);

  yield takeEvery(ATTENTION_SHIFT, shiftAttention);

  // 🤔 A saga might be overkill for this, but maybe not because the command palette doesn't know what the state of selected activities is, so it wouldn't know what activity to apply your command to...ehhhh maybe not...still not sure

  yield takeEvery(TODO_BEGIN, createActivity);
  yield takeEvery(TODO_CREATE, createTodo);

  yield takeEvery(TRACE_CREATE, createTrace);
  yield takeEvery(TRACE_DELETE, deleteTrace);
  yield takeLatest(TRACE_FETCH, fetchTrace);
  yield takeLatest(TRACE_SELECT, fetchTrace);
  yield takeLatest(`${TRACE_FETCH}_SUCCEEDED`, processFetchedTrace);

  yield takeEvery(THREAD_CREATE, createThread);
  yield takeEvery(THREAD_DELETE, deleteThread);
  yield takeEvery(THREAD_DELETE, persistHiddenThreads);
  yield takeEvery(THREAD_UPDATE, updateThread);
  yield takeEvery(THREAD_HIDE, persistHiddenThreads);
  yield takeEvery(THREADS_REORDER, reorderThreads);
  yield takeEvery(TRACE_FILTER, persistHiddenThreads);

  yield takeLatest(USER_FETCH, fetchUser);
  yield takeLatest(SETTING_TOGGLE, persistUserSetting);

  // yield takeEvery('FETCH_RESOURCE', fetchResource);
}

export default networkSaga;
