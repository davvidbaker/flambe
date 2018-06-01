import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import { push } from 'react-router-redux';

import {
  createToast,
  processTimelineTrace,
  ACTIVITY_CREATE,
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
  MANTRA_CREATE,
  THREAD_CREATE,
  THREAD_DELETE,
  THREAD_UPDATE,
  TODO_CREATE,
  TODO_BEGIN,
  TRACE_CREATE,
  TRACE_FETCH,
  TRACE_SELECT,
  TRACE_DELETE,
  USER_FETCH,
} from 'actions';
import { getUser } from 'reducers/user';
import { getTimeline } from 'reducers/timeline';

async function hitNetwork({ resource, params = {} }) {
  const response = await fetch(
    params.method === 'POST'
      ? `${SERVER}/api/${resource.path}`
      : `${SERVER}/api/${resource.path}/${resource.id}`,
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      ...params,
    }
  );
  if (!response.ok) throw response;
  if (response.status === 204) return { data: null };
  return response.json();
}

/** 💁 I tried doing an async generator but was running into call stack exceptions and it seemed to be swallowing put errors. Using Redux-Saga `call works instead */
function* fetchResource(actionType, { resource, params }) {
  // action should be {resourceType, resourceIdentifier}
  try {
    const json = yield call(hitNetwork, { resource, params });
    const { data } = json;
    yield put({ type: `${actionType}_SUCCEEDED`, data });
  } catch (e) {
    if (e.status === 401) {
      yield put(push('/login'));
      return;
    }
    console.log(`network error e`, e);
    yield put(
      createToast(
        `${actionType.replace(/_/g, ' ')} failed. Network error.`,
        'error'
      )
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
}) {
  const timeline = yield select(getTimeline);

  yield fetchResource(type, {
    resource: { path: 'activities' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        trace_id: timeline.trace.id,
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
}

function* endActivity({ type, id, timestamp, message, eventFlavor = 'E' }) {
  const timeline = yield select(getTimeline);
  yield fetchResource(type, {
    /** 💁 path of 'events' is not a mistake */
    resource: { path: 'events' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        trace_id: timeline.trace.id,
        activity_id: id,
        event: {
          timestamp_integer: timestamp,
          message,
          phase: eventFlavor,
        },
      }),
    },
  });
}

function* suspendActivity({ type, id, timestamp, message }) {
  const timeline = yield select(getTimeline);
  yield fetchResource(type, {
    /** 💁 path of 'events' is not a mistake */
    resource: { path: 'events' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        trace_id: timeline.trace.id,
        activity_id: id,
        event: {
          timestamp_integer: timestamp,
          message,
          phase: 'S',
        },
      }),
    },
  });
}

// 🔮 if you don't want to delete the events along with the activity, make changes here
function* deleteActivity({ type, id }) {
  yield fetchResource(type, {
    resource: { path: 'activities', id },
    params: {
      method: 'DELETE',
      body: JSON.stringify({
        delete_events: true,
      }),
    },
  });
}

// { name, thread_id, category_ids = [] }
function* updateActivity({ type, id, updates }) {
  yield fetchResource(type, {
    resource: { path: 'activities', id },
    params: {
      method: 'PUT',
      body: JSON.stringify({ activity: { ...updates } }),
    },
  });
}

function* updateEvent({ type, id, updates }) {
  yield fetchResource(type, {
    resource: { path: 'events', id },
    params: {
      method: 'PUT',
      body: JSON.stringify({ event: { ...updates } }),
    },
  });

  const trace = (yield select(getTimeline)).trace;
  console.log(`trace`, trace);
  /* ⚠️ This is bad. Shouldn't need to use the network!! */
  yield call(fetchTrace, { trace });
}

function* createCategory({ type, activity_id, name, color_background }) {
  const user = yield select(getUser);
  yield fetchResource(type, {
    resource: { path: 'categories' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        /** 🔮 <-(first crystal ball use) if you want to be able to set a bunch of activities to a new category, this will have to change, like with highlighting a big section */
        activity_ids: [activity_id],
        category: { name, color_background },
      }),
    },
  });
}

function* createTodo({ type, name, description }) {
  const user = yield select(getUser);
  yield fetchResource(type, {
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

function* updateCategory({ type, id, updates }) {
  yield fetchResource(type, {
    resource: { path: 'categories', id },
    params: {
      method: 'PUT',
      body: JSON.stringify({
        category: { ...updates },
      }),
    },
  });
}

function* createMantra({ type, name }) {
  const user = yield select(getUser);
  yield fetchResource(type, {
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

function* shiftAttention({ type, thread_id, timestamp }) {
  const user = yield select(getUser);
  yield fetchResource(type, {
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

function* updateThread({ type, id, updates }) {
  yield fetchResource(type, {
    resource: { path: 'threads', id },
    params: {
      method: 'PUT',
      body: JSON.stringify({
        thread: { ...updates },
      }),
    },
  });
}

function* deleteThread({ type, id }) {
  yield fetchResource(type, {
    resource: { path: 'threads', id },
    params: {
      method: 'DELETE',
    },
  });
}

function* createTrace({ type, name }) {
  const user = yield select(getUser);
  yield fetchResource(type, {
    resource: { path: 'traces' },
    params: {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, trace: { name } }),
    },
  });
}

function* fetchUser({ type, id }) {
  yield fetchResource(type, {
    resource: { path: 'users', id },
  });
}

function* fetchTrace({ trace }) {
  yield fetchResource(TRACE_FETCH, {
    resource: { path: 'traces', id: trace.id },
  });
}

function* deleteTrace({ type, id }) {
  yield fetchResource(type, {
    resource: { path: 'traces', id },
    params: {
      method: 'DELETE',
    },
  });
}

function isCollapsed(persistedThreads, thread) {
  if (!persistedThreads) return false;

  const found = persistedThreads[thread.id];
  if (found) {
    return found.collapsed;
  }
  return false;
}

function* processFetchedTrace({ data }) {
  const timeline = yield select(getTimeline);
  const persistedThreads = timeline.threads;

  yield put(
    processTimelineTrace(
      data.events.map(event => ({
        ...event,
        timestamp: new Date(event.timestamp).getTime(),
      })),
      data.threads.map(thread => ({
        ...thread,
        collapsed: isCollapsed(persistedThreads, thread),
      }))
    )
  );
}

function* createThread({ type, name, rank }) {
  const timeline = yield select(getTimeline);
  yield fetchResource(type, {
    resource: { path: 'threads' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        trace_id: timeline.trace.id,
        thread: { name, rank },
      }),
    },
  });
}

/* ⚠️ Soooo resumeActivity and resurrectActivity are almost identical. Some refactoring is in ofder. */
function* resumeActivity({ type, id, timestamp, message }) {
  const timeline = yield select(getTimeline);
  yield fetchResource(type, {
    /** 💁 path of 'events' is not a mistake */
    resource: { path: 'events' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        trace_id: timeline.trace.id,
        activity_id: id,
        event: {
          timestamp_integer: timestamp,
          message,
          phase: 'R',
        },
      }),
    },
  });
}

function* resurrectActivity({ type, id, timestamp, message }) {
  const timeline = yield select(getTimeline);
  yield fetchResource(type, {
    /** 💁 path of 'events' is not a mistake */
    resource: { path: 'events' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        trace_id: timeline.trace.id,
        activity_id: id,
        event: {
          timestamp_integer: timestamp,
          message,
          phase: 'X',
        },
      }),
    },
  });
}
// // // // // // // // // // // // // // // // // // // // // // // //

function* networkSaga() {
  yield takeEvery(ACTIVITY_CREATE, createActivity);
  yield takeEvery(ACTIVITY_DELETE, deleteActivity);
  yield takeEvery(ACTIVITY_END, endActivity);
  yield takeEvery(ACTIVITY_RESUME, resumeActivity);
  yield takeEvery(ACTIVITY_RESURRECT, resurrectActivity);
  yield takeEvery(ACTIVITY_SUSPEND, suspendActivity);
  yield takeEvery(ACTIVITY_UPDATE, updateActivity);

  yield takeEvery(CATEGORY_CREATE, createCategory);
  yield takeEvery(CATEGORY_UPDATE, updateCategory);

  yield takeEvery(EVENT_UPDATE, updateEvent);

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
  yield takeEvery(THREAD_UPDATE, updateThread);

  yield takeLatest(USER_FETCH, fetchUser);

  // yield takeEvery('FETCH_RESOURCE', fetchResource);
}

export default networkSaga;
