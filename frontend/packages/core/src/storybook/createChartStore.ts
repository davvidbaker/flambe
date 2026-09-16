import { createStore } from 'redux';

import {
  processTimelineTrace,
  selectTrace,
  setTimeline,
  USER_FETCH,
} from '../actions';
import { MAX_TIME_INTO_FUTURE } from '../constants/defaultParameters';
import { rootReducer } from '../rootReducer';
import type { Observation } from '../reducers/user';
import { DAY, HOUR } from '../utilities/time';
import type { AppChartFixture } from './fixtureTrace';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function seedObservations(minTime: number, now: number): Observation[] {
  const start = new Date(minTime);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  const startMs = start.getTime();
  const endMs = Math.max(startMs, end.getTime());
  const dayCount = Math.round((endMs - startMs) / DAY) + 1;
  const stepDays = Math.max(1, Math.ceil(dayCount / 14));
  const observations: Observation[] = [];
  let index = 0;

  for (
    let time = startMs;
    time <= endMs && index < 20;
    time = new Date(
      new Date(time).getFullYear(),
      new Date(time).getMonth(),
      new Date(time).getDate() + stepDays,
    ).getTime()
  ) {
    const day = new Date(time);
    const observedOn = `${day.getFullYear()}-${pad2(day.getMonth() + 1)}-${pad2(day.getDate())}`;
    observations.push({
      kind: 'carbon',
      value: 280 + (index % 5) * 18 + (index % 3) * 4,
      unit: 'gCO2eq/kWh',
      observed_on: observedOn,
      timestamp: time + 8 * HOUR,
    });
    index += 1;
  }

  const span = Math.max(HOUR, now - minTime);
  const moodCount = 8;
  for (let i = 0; i < moodCount; i += 1) {
    observations.push({
      kind: 'mood',
      value: 3 + (i % 5) + (i % 3) * 0.4,
      timestamp: minTime + (span * i) / (moodCount - 1),
    });
  }

  return observations;
}

export function viewportForFixture(fixture: AppChartFixture, now = Date.now()) {
  const timestamps = fixture.events.map(event => event.timestamp);
  const minTime = timestamps.length > 0
    ? Math.min(...timestamps) - 5 * 60 * 1000
    : now - 60 * 60 * 1000;
  const maxTime = now + MAX_TIME_INTO_FUTURE;
  return { minTime, maxTime };
}

export function seedChartViewport(fixture: AppChartFixture, now = Date.now()) {
  if (typeof window === 'undefined') return;
  const { minTime, maxTime } = viewportForFixture(fixture, now);
  window.localStorage.setItem('lbt', String(minTime));
  window.localStorage.setItem('rbt', String(maxTime));
  window.localStorage.setItem('flambe.timeline.viewport-trace-id.v1', String(fixture.traceId));
}

export function createChartStore(
  fixture: AppChartFixture,
  now = Date.now(),
  extras: {
    mantras?: { name: string; timestamp: number }[];
    observations?: Observation[];
    traces?: { id: AppChartFixture['traceId']; name: string }[];
  } = {},
) {
  const store = createStore(rootReducer);
  const { minTime, maxTime } = viewportForFixture(fixture, now);
  const traces = extras.traces ?? [{ id: fixture.traceId, name: fixture.traceName }];

  store.dispatch({
    type: `${USER_FETCH}_SUCCEEDED`,
    data: {
      id: 1,
      name: 'Storybook',
      username: 'storybook',
      categories: fixture.categories,
      attentionShifts: fixture.attentionShifts,
      mantras: extras.mantras ?? [{ name: 'Ship the favicon', timestamp: now }],
      observations: extras.observations ?? seedObservations(minTime, now),
      traces,
    },
  });
  store.dispatch(selectTrace({ id: fixture.traceId, name: fixture.traceName }));
  store.dispatch(processTimelineTrace(fixture.events, fixture.threads));
  store.dispatch(setTimeline(minTime, maxTime));

  return store;
}
