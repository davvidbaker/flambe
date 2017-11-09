/**
 * I'm kinda spying on apollo. Is that bad practice? Probably...
 */
import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';

import {
  processTimelineTrace,
  ACTIVITY_CREATE,
  ACTIVITY_DELETE,
  ACTIVITY_END,
  ACTIVITY_UPDATE,
  CATEGORY_CREATE,
  CATEGORY_UPDATE,
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

// function* respondToQuery(action) {
//   switch (action.operationName) {
//     case 'AllEventsInTrace':
//       const trace = action.result.data.Trace;
//       if (trace.events.length === 0) {
//         console.warn('trace had 0 events!', trace);
//       } else {
//         yield put(
//           processTimelineTrace(
//             trace.events.map(event => ({
//               ...event,
//               timestamp: new Date(event.timestamp).getTime(),
//             })),
//             trace.threads
//           )
//         );
//       }
//       break;

//     case 'AllCategories':
//       const categories = action.result.data.User.categories;

//       if (categories.length > 0) {
//         // ⚠️ make an action creator
//         yield put({
//           type: 'SET_CATEGORIES',
//           categories, // .map(cat => cat.id),
//         });
//       }
//       break;

//     default:
//       break;
//   }
// }

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
    },
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
    const data = json.data;
    console.log('json success, data:', data);
    yield put({ type: `${actionType}_SUCCEEDED`, data });
  } catch (e) {
    console.log('failed response', `${actionType}_FAILED`, e, e.statusText);
  }
}

// // // // // // // // // // // // // // // // // // // // // // // //

/** 💁 Creating an activity from a todo automatically handles deleting that todo (from the database). */
function* createActivity({
  type,
  name,
  timestamp,
  description,
  thread_id /* message */,
  category_id,
  todo_id = null,
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
        event: { timestamp_integer: timestamp },
        activity: { name, description },
      }),
    },
  });
}

function* endActivity({ type, id, timestamp, message }) {
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
          phase: 'E',
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

function* updateActivity({ type, id, name }) {
  yield fetchResource(type, {
    resource: { path: 'activities', id },
    params: {
      method: 'PUT',
      body: JSON.stringify({ activity: { name } }),
    },
  });
}

function* createCategory({ type, activity_id, name, color }) {
  const user = yield select(getUser);
  yield fetchResource(type, {
    resource: { path: 'categories' },
    params: {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        /** 🔮 <-(first crystal ball use) if you want to be able to set a bunch of activities to a new category, this will have to change, like with highlighting a big section */
        activity_ids: [activity_id],
        category: { name, color },
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

function* processFetchedTrace({ data }) {
  yield put(
    processTimelineTrace(
      data.events.map(event => ({
        ...event,
        timestamp: new Date(event.timestamp).getTime(),
      })),
      data.threads,
    ),
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

// // // // // // // // // // // // // // // // // // // // // // // //

function* mainSaga() {
  /** Not sure what the difference between these two actions is 🤷 */
  // yield takeEvery('APOLLO_QUERY_RESULT', respondToQuery);
  // yield takeEvery('APOLLO_QUERY_RESULT_CLIENT', respondToQuery);

  yield takeEvery(ACTIVITY_CREATE, createActivity);
  yield takeEvery(ACTIVITY_DELETE, deleteActivity);
  yield takeEvery(ACTIVITY_END, endActivity);
  yield takeEvery(ACTIVITY_UPDATE, updateActivity);

  yield takeEvery(CATEGORY_CREATE, createCategory);
  yield takeEvery(CATEGORY_UPDATE, updateCategory);

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

export default mainSaga;
