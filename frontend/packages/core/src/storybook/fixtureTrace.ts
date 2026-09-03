import type { Activity } from '../types/Activity';
import type { Category } from '../types/Category';
import type { EntityId } from '../types/ids';
import type { Thread } from '../types/Thread';
import type { TraceEvent } from '../types/TraceEvent';
import type { AttentionShift } from '../reducers/user';

const MINUTE = 60 * 1000;

export const APP_CHART_TRACE_ID = 9001;

export type AppChartFixture = {
  attentionShifts: AttentionShift[];
  categories: Category[];
  events: TraceEvent[];
  threads: Thread[];
  traceId: EntityId;
  traceName: string;
};

export type AppChartFixtureOptions = {
  collapsedThreadIds?: EntityId[];
  now?: number;
};

const categories: Category[] = [
  { id: 1, name: 'coding', color_background: '#efc360', color_text: '#000000' },
  { id: 2, name: 'investigation', color_background: '#60a5fa', color_text: '#000000' },
  { id: 3, name: 'review', color_background: '#a78bfa', color_text: '#ffffff' },
];

function minutesAgo(now: number, minutes: number): number {
  return now - minutes * MINUTE;
}

function activity(
  thread: Thread,
  fields: Omit<Activity, 'thread' | 'thread_id'> & { categories: EntityId[] },
): Activity {
  return {
    ...fields,
    thread,
    thread_id: thread.id,
  };
}

export function createAppChartFixture({
  collapsedThreadIds = [],
  now = Date.now(),
}: AppChartFixtureOptions = {}): AppChartFixture {
  const collapsed = new Set(collapsedThreadIds.map(String));
  const flambe: Thread = {
    id: 1,
    name: 'flambe🔥',
    rank: 0,
    collapsed: collapsed.has('1'),
  };
  const elastic: Thread = {
    id: 2,
    name: 'elastic 🛒',
    rank: 1,
    collapsed: collapsed.has('2'),
  };

  const pointStorybook = activity(flambe, {
    id: 10,
    name: 'Point Storybook at the real app chart',
    categories: [1],
  });
  const auditSplit = activity(flambe, {
    id: 11,
    name: 'Audit Storybook vs app FlameChart split',
    parent_id: pointStorybook.id,
    categories: [2],
  });
  const addStorybook = activity(flambe, {
    id: 12,
    name: 'Add app Storybook with fixture store',
    parent_id: pointStorybook.id,
    agent_id: 'cursor:storybook-session',
    agent_name: 'Cursor',
    categories: [1],
  });
  const writeFixture = activity(flambe, {
    id: 13,
    name: 'Write fixture trace',
    parent_id: addStorybook.id,
    categories: [1],
  });
  const wireHarness = activity(flambe, {
    id: 14,
    name: 'Wire ChartHarness',
    parent_id: addStorybook.id,
    categories: [1],
  });
  const parkedPackage = activity(flambe, {
    id: 16,
    name: 'Investigate npm package drift',
    parent_id: pointStorybook.id,
    categories: [2],
  });
  const heatRates = activity(elastic, {
    id: 30,
    name: 'MDLDATA-9 EIA/CEMS heat rates',
    categories: [1],
  });
  const convertCc = activity(elastic, {
    id: 31,
    name: 'Convert CC benchmarks',
    parent_id: heatRates.id,
    categories: [2],
  });

  const events: TraceEvent[] = [
    { id: 101, timestamp: minutesAgo(now, 90), phase: 'B', activity: heatRates, message: 'Started' },
    { id: 102, timestamp: minutesAgo(now, 85), phase: 'B', activity: convertCc },
    { id: 103, timestamp: minutesAgo(now, 85), phase: 'B', activity: pointStorybook, message: 'Started' },
    { id: 104, timestamp: minutesAgo(now, 82), phase: 'B', activity: auditSplit },
    { id: 105, timestamp: minutesAgo(now, 70), phase: 'E', activity: auditSplit, message: 'Confirmed fork' },
    { id: 106, timestamp: minutesAgo(now, 68), phase: 'B', activity: addStorybook },
    { id: 107, timestamp: minutesAgo(now, 65), phase: 'B', activity: writeFixture },
    { id: 108, timestamp: minutesAgo(now, 58), phase: 'E', activity: convertCc, message: 'Converted' },
    { id: 109, timestamp: minutesAgo(now, 52), phase: 'S', activity: addStorybook, message: 'Waiting on chart resize' },
    { id: 110, timestamp: minutesAgo(now, 48), phase: 'S', activity: heatRates, message: 'Waiting on data' },
    { id: 111, timestamp: minutesAgo(now, 36), phase: 'R', activity: addStorybook, message: 'Chart is drawing' },
    { id: 112, timestamp: minutesAgo(now, 30), phase: 'R', activity: heatRates, message: 'Rates landed' },
    { id: 113, timestamp: minutesAgo(now, 28), phase: 'E', activity: writeFixture },
    { id: 114, timestamp: minutesAgo(now, 26), phase: 'B', activity: wireHarness },
    { id: 115, timestamp: minutesAgo(now, 22), phase: 'E', activity: heatRates, message: 'Landed rates' },
    { id: 116, timestamp: minutesAgo(now, 16), phase: 'E', activity: wireHarness },
    { id: 117, timestamp: minutesAgo(now, 14), phase: 'E', activity: addStorybook },
    { id: 118, timestamp: minutesAgo(now, 12), phase: 'B', activity: parkedPackage },
    { id: 119, timestamp: minutesAgo(now, 10), phase: 'S', activity: parkedPackage, message: 'Not the app chart' },
    { id: 120, timestamp: minutesAgo(now, 8), phase: 'X', activity: auditSplit, message: 'Came back to the audit' },
  ];

  return {
    attentionShifts: [
      { thread_id: elastic.id, timestamp: minutesAgo(now, 90) },
      { thread_id: flambe.id, timestamp: minutesAgo(now, 85) },
    ],
    categories,
    events,
    threads: [flambe, elastic],
    traceId: APP_CHART_TRACE_ID,
    traceName: 'Storybook fixture',
  };
}
