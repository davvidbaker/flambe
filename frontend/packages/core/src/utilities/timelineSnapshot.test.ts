import { createAppChartFixture } from '../storybook/fixtureTrace';
import {
  buildTimelineSnapshot,
  isTimelineSnapshot,
} from './timelineSnapshot';

const now = 1_700_000_000_000;

function sourceFromFixture() {
  const fixture = createAppChartFixture({ now, collapsedThreadIds: [2] });
  return {
    fixture,
    source: {
      traceId: fixture.traceId,
      traceName: fixture.traceName,
      threads: fixture.threads,
      events: fixture.events,
      categories: fixture.categories,
      attentionShifts: fixture.attentionShifts,
    },
  };
}

describe('buildTimelineSnapshot', () => {
  it('omits hidden threads and preserves collapse on included ones', () => {
    const { source } = sourceFromFixture();
    const snapshot = buildTimelineSnapshot(source, {
      leftBoundaryTime: now - 60 * 60 * 1000,
      rightBoundaryTime: now,
      includedThreadIds: [1],
      collapsedThreadIds: [1],
      exportedAt: now,
    });

    expect(snapshot.version).toBe(1);
    expect(snapshot.fixture.threads.map(thread => [thread.id, thread.collapsed, thread.rank])).toEqual([
      [1, true, 0],
    ]);
    expect(snapshot.fixture.events.every(event => event.activity?.thread_id === 1)).toBe(true);
    expect(snapshot.timeLabels).toEqual({
      absoluteTimeLabels: false,
      twelveHourClock: false,
    });
  });

  it('clips a straddling activity to the window instead of keeping the whole span', () => {
    const thread = { id: 1, name: 'main', rank: 0 };
    const activity = {
      id: 10,
      name: 'Long task',
      categories: [1],
      thread,
      thread_id: 1,
    };
    const snapshot = buildTimelineSnapshot(
      {
        traceId: 1,
        traceName: 'clip',
        threads: [thread],
        categories: [{ id: 1, name: 'coding', color_background: '#efc360', color_text: '#000000' }],
        attentionShifts: [],
        events: [
          { id: 1, timestamp: 1_000, phase: 'B', activity },
          { id: 2, timestamp: 5_000, phase: 'E', activity, message: 'done' },
        ],
      },
      {
        leftBoundaryTime: 3_000,
        rightBoundaryTime: 4_000,
        includedThreadIds: [1],
        collapsedThreadIds: [],
        exportedAt: 4_000,
      },
    );

    expect(snapshot.fixture.events.map(event => event.timestamp)).toEqual([3_000, 4_000]);
    expect(snapshot.fixture.events.map(event => event.phase)).toEqual(['B', 'E']);
  });

  it('keeps API-shaped activities that only expose thread.id', () => {
    const thread = { id: 7, name: 'api', rank: 0 };
    const activity = {
      id: 10,
      name: 'From network',
      categories: [],
      thread: { id: 7 },
    };
    const snapshot = buildTimelineSnapshot(
      {
        traceId: 1,
        traceName: 'api',
        threads: [thread],
        categories: [],
        attentionShifts: [],
        events: [
          { id: 1, timestamp: 1_000, phase: 'B', activity },
          { id: 2, timestamp: 2_000, phase: 'E', activity },
        ],
      },
      {
        leftBoundaryTime: 500,
        rightBoundaryTime: 3_000,
        includedThreadIds: [7],
        collapsedThreadIds: [],
      },
    );

    expect(snapshot.fixture.events).toHaveLength(2);
    expect(snapshot.fixture.events[0]?.activity).toMatchObject({
      id: 10,
      thread_id: 7,
      thread: { id: 7 },
    });
  });

  it('drops activities that ended before the window', () => {
    const thread = { id: 1, name: 'main', rank: 0 };
    const early = {
      id: 10,
      name: 'Early',
      categories: [],
      thread,
      thread_id: 1,
    };
    const late = {
      id: 11,
      name: 'Late',
      categories: [],
      thread,
      thread_id: 1,
    };
    const snapshot = buildTimelineSnapshot(
      {
        traceId: 1,
        traceName: 'clip',
        threads: [thread],
        categories: [],
        attentionShifts: [],
        events: [
          { id: 1, timestamp: 1_000, phase: 'B', activity: early },
          { id: 2, timestamp: 2_000, phase: 'E', activity: early },
          { id: 3, timestamp: 8_000, phase: 'B', activity: late },
          { id: 4, timestamp: 9_000, phase: 'E', activity: late },
        ],
      },
      {
        leftBoundaryTime: 7_000,
        rightBoundaryTime: 10_000,
        includedThreadIds: [1],
        collapsedThreadIds: [],
      },
    );

    expect(snapshot.fixture.events.map(event => event.activity?.id)).toEqual([11, 11]);
  });

  it('keeps same-thread ancestors of an intersecting child', () => {
    const thread = { id: 1, name: 'main', rank: 0 };
    const parent = {
      id: 10,
      name: 'Parent',
      categories: [],
      thread,
      thread_id: 1,
    };
    const child = {
      id: 11,
      name: 'Child',
      categories: [],
      thread,
      thread_id: 1,
      parent_id: 10,
    };
    const snapshot = buildTimelineSnapshot(
      {
        traceId: 1,
        traceName: 'nest',
        threads: [thread],
        categories: [],
        attentionShifts: [],
        events: [
          { id: 1, timestamp: 1_000, phase: 'B', activity: parent },
          { id: 2, timestamp: 8_000, phase: 'B', activity: child },
          { id: 3, timestamp: 9_000, phase: 'E', activity: child },
        ],
      },
      {
        leftBoundaryTime: 7_500,
        rightBoundaryTime: 9_500,
        includedThreadIds: [1],
        collapsedThreadIds: [],
      },
    );

    expect(new Set(snapshot.fixture.events.map(event => event.activity?.id))).toEqual(new Set([10, 11]));
    expect(snapshot.fixture.events.every(event => (
      event.timestamp >= 7_500 && event.timestamp <= 9_500
    ))).toBe(true);
  });

  it('filters attention shifts to the window and included threads', () => {
    const { source } = sourceFromFixture();
    const snapshot = buildTimelineSnapshot(
      {
        ...source,
        attentionShifts: [
          { thread_id: 1, timestamp: now - 1_000 },
          { thread_id: 2, timestamp: now - 1_000 },
          { thread_id: 1, timestamp: now - 3 * 60 * 60 * 1000 },
        ],
      },
      {
        leftBoundaryTime: now - 60 * 60 * 1000,
        rightBoundaryTime: now,
        includedThreadIds: [1],
        collapsedThreadIds: [],
        exportedAt: now,
      },
    );

    expect(snapshot.fixture.attentionShifts).toEqual([{ thread_id: 1, timestamp: now - 1_000 }]);
  });

  it('freezes the applied time label settings', () => {
    const { source } = sourceFromFixture();
    const snapshot = buildTimelineSnapshot(source, {
      leftBoundaryTime: now - 1000,
      rightBoundaryTime: now,
      includedThreadIds: [1],
      collapsedThreadIds: [],
      absoluteTimeLabels: true,
      twelveHourClock: true,
    });

    expect(snapshot.timeLabels).toEqual({
      absoluteTimeLabels: true,
      twelveHourClock: true,
    });
  });
});

describe('isTimelineSnapshot', () => {
  it('accepts a built snapshot and rejects junk', () => {
    const { source } = sourceFromFixture();
    const snapshot = buildTimelineSnapshot(source, {
      leftBoundaryTime: now - 1000,
      rightBoundaryTime: now,
      includedThreadIds: [1, 2],
      collapsedThreadIds: [2],
    });
    expect(isTimelineSnapshot(snapshot)).toBe(true);
    expect(isTimelineSnapshot({})).toBe(false);
    expect(isTimelineSnapshot({ version: 1, viewport: {}, fixture: { events: [], threads: [] } })).toBe(false);
  });
});
