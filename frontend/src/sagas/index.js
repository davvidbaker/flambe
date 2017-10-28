/**
 * I'm kinda spying on apollo. Is that bad practice? Probably...
 */

import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import { processTimelineTrace, updateActivity } from 'actions';
import { getUser } from 'reducers/user';

function* respondToQuery(action) {
  switch (action.operationName) {
    case 'AllEventsInTrace':
      const trace = action.result.data.Trace;
      if (trace.events.length === 0) {
        console.warn('trace had 0 events!', trace);
      } else {
        yield put(
          processTimelineTrace(
            trace.events.map(event => ({
              ...event,
              timestamp: new Date(event.timestamp).getTime(),
            })),
            trace.threads
          )
        );
      }
      break;

    case 'AllCategories':
      const categories = action.result.data.User.categories;

      if (categories.length > 0) {
        // ⚠️ make an action creator
        yield put({
          type: 'SET_CATEGORIES',
          categories, // .map(cat => cat.id),
        });
      }
      break;

    default:
      break;
  }
}

function* respondToMutation(action) {
  switch (action.operationName) {
    case 'DeleteActivity':
      break;
    // case 'DeleteEvent':
    // yield put(
    //   processTimelineTrace(
    //     trace.events.map(event => ({
    //       ...event,
    //       timestamp: new Date(event.timestamp).getTime(),
    //     })),
    //     trace.threads
    //   )
    // );
    // yield


    default:
      break;
  }
}

async function requestResource(resource) {
  const response = await fetch(`${SERVER}/api/${resource.type}/${resource.id}`);
  return response.json();
}

/**
 * ⚠️ I tried doing an async generator but was running into call stack exceptions and it seemed to be swallowing put errors.
 */
function* fetchResource({ resource }) {
  // action should be {resourceType, resourceIdentifier}

  try {
    const json = yield call(requestResource, resource);
    console.log('json success', json);
    yield put({ type: `FETCH_${resource.type.toUpperCase()}_SUCCEEDED`, json });
  } catch (e) {
    console.log('after', `FETCH_${resource.type.toUpperCase()}_FAILED`, e);
  }

  // console.log('got here')
  // yield put({ type: `FETCH_${resource.type.toUpperCase()}_FAILED` });
  // console.log('got to end')
}

function* mainSaga() {
  /** Not sure what the difference between these two actions is 🤷 */
  yield takeEvery('APOLLO_QUERY_RESULT', respondToQuery);
  yield takeEvery('APOLLO_QUERY_RESULT_CLIENT', respondToQuery);

  yield takeEvery('APOLLO_MUTATION_RESULT', respondToMutation);

  yield takeEvery('FETCH_RESOURCE', fetchResource);
}

export default mainSaga;
