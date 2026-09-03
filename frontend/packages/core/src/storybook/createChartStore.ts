import { combineReducers, createStore } from 'redux';

import * as reducers from '../reducers';
import {
  processTimelineTrace,
  selectTrace,
  setTimeline,
  USER_FETCH,
} from '../actions';
import { MAX_TIME_INTO_FUTURE } from '../constants/defaultParameters';
import type { AppChartFixture } from './fixtureTrace';

const rootReducer = combineReducers({ ...reducers });

export function viewportForFixture(fixture: AppChartFixture, now = Date.now()) {
  const timestamps = fixture.events.map(event => event.timestamp);
  const minTime = timestamps.length > 0
    ? Math.min(...timestamps) - 5 * 60 * 1000
    : now - 60 * 60 * 1000;
  const maxTime = now + MAX_TIME_INTO_FUTURE;
  return { minTime, maxTime };
}

export function seedChartViewport(fixture: AppChartFixture, now = Date.now()) {
  const { minTime, maxTime } = viewportForFixture(fixture, now);
  window.localStorage.setItem('lbt', String(minTime));
  window.localStorage.setItem('rbt', String(maxTime));
  window.localStorage.setItem('flambe.timeline.viewport-trace-id.v1', String(fixture.traceId));
}

export function createChartStore(fixture: AppChartFixture, now = Date.now()) {
  const store = createStore(rootReducer);
  const { minTime, maxTime } = viewportForFixture(fixture, now);

  store.dispatch({
    type: `${USER_FETCH}_SUCCEEDED`,
    data: {
      id: 1,
      name: 'Storybook',
      username: 'storybook',
      categories: fixture.categories,
      attentionShifts: fixture.attentionShifts,
      traces: [{ id: fixture.traceId, name: fixture.traceName }],
    },
  });
  store.dispatch(selectTrace({ id: fixture.traceId, name: fixture.traceName }));
  store.dispatch(processTimelineTrace(fixture.events, fixture.threads));
  store.dispatch(setTimeline(minTime, maxTime));

  return store;
}
