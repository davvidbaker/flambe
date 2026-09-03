import type { Activity } from '../types/Activity';
import type { Category } from '../types/Category';
import type { EntityId } from '../types/ids';
import type { Thread } from '../types/Thread';
import type { TraceEvent } from '../types/TraceEvent';
import type { AppChartFixture } from './fixtureTrace';

const MINUTE = 60 * 1000;

const categories: Category[] = [
  { id: 1, name: 'coding', color_background: '#efc360', color_text: '#000000' },
  { id: 2, name: 'investigation', color_background: '#60a5fa', color_text: '#000000' },
  { id: 3, name: 'review', color_background: '#a78bfa', color_text: '#ffffff' },
  { id: 4, name: 'operations', color_background: '#34d399', color_text: '#000000' },
  { id: 5, name: 'failure', color_background: '#fb7185', color_text: '#000000' },
];

function minutesAgo(now: number, minutes: number): number {
  return now - minutes * MINUTE;
}

function thread(id: EntityId, name: string, rank = 0, collapsed = false): Thread {
  return { id, name, rank, collapsed };
}

function activity(
  owner: Thread,
  id: EntityId,
  name: string,
  options: {
    agentName?: string;
    /** Model provider prefix for agent_id (`claude`, `cursor`, `codex`). */
    agentProvider?: string;
    category?: EntityId;
    parentId?: EntityId;
  } = {},
): Activity {
  const slug = options.agentName?.toLowerCase().replace(/\s+/g, '-');
  return {
    id,
    name,
    thread: owner,
    thread_id: owner.id,
    parent_id: options.parentId,
    categories: [options.category ?? 1],
    ...(options.agentName && slug
      ? {
          agent_id: options.agentProvider
            ? `${options.agentProvider}:${slug}`
            : slug,
          agent_name: options.agentName,
        }
      : {}),
  };
}

function fixture(
  traceId: EntityId,
  traceName: string,
  threads: Thread[],
  events: TraceEvent[],
): AppChartFixture {
  return {
    traceId,
    traceName,
    threads,
    events,
    categories,
    attentionShifts: threads.length > 0 && events.length > 0
      ? [{ thread_id: threads[0].id, timestamp: Math.min(...events.map(event => event.timestamp)) }]
      : [],
  };
}

export function createConcurrentAgentsFixture(now = Date.now()): AppChartFixture {
  const app = thread(1, 'flambe🔥');
  const release = thread(2, 'release 🚀', 1);

  const sharedRoot = activity(app, 90, 'Ship agent-aware trace view', { category: 3 });
  const steve = activity(app, 100, 'Add trace filters', {
    agentName: 'Steve',
    agentProvider: 'cursor',
    category: 1,
    parentId: sharedRoot.id,
  });
  const steveInspect = activity(app, 101, 'Inspect reducers', {
    agentName: 'Steve',
    agentProvider: 'cursor',
    category: 2,
    parentId: steve.id,
  });
  const belinda = activity(app, 110, 'Fix reconnect ordering', {
    agentName: 'Belinda',
    agentProvider: 'claude',
    category: 5,
    parentId: sharedRoot.id,
  });
  const belindaTest = activity(app, 111, 'Exercise socket race', {
    agentName: 'Belinda',
    agentProvider: 'claude',
    category: 2,
    parentId: belinda.id,
  });
  const miles = activity(app, 120, 'Review activity API', {
    agentName: 'Miles',
    agentProvider: 'claude',
    category: 3,
    parentId: sharedRoot.id,
  });
  const nora = activity(app, 121, 'Diagnose flaky assertion', {
    agentName: 'Nora',
    agentProvider: 'codex',
    category: 2,
    parentId: belindaTest.id,
  });
  const human = activity(app, 130, 'Decide merge order', {
    category: 3,
    parentId: sharedRoot.id,
  });
  const deploy = activity(release, 140, 'Publish preview', {
    agentName: 'Deploy bot',
    agentProvider: 'codex',
    category: 4,
  });

  return fixture(9100, 'Concurrent agents', [app, release], [
    { id: 1000, timestamp: minutesAgo(now, 70), phase: 'B', activity: sharedRoot },
    { id: 1001, timestamp: minutesAgo(now, 65), phase: 'B', activity: steve },
    { id: 1002, timestamp: minutesAgo(now, 62), phase: 'B', activity: steveInspect },
    { id: 1003, timestamp: minutesAgo(now, 58), phase: 'B', activity: belinda },
    { id: 1004, timestamp: minutesAgo(now, 54), phase: 'B', activity: belindaTest },
    { id: 1005, timestamp: minutesAgo(now, 48), phase: 'B', activity: miles },
    { id: 1006, timestamp: minutesAgo(now, 42), phase: 'E', activity: steveInspect },
    { id: 1007, timestamp: minutesAgo(now, 37), phase: 'S', activity: belindaTest, message: 'Race is intermittent' },
    { id: 1008, timestamp: minutesAgo(now, 40), phase: 'B', activity: nora },
    { id: 1009, timestamp: minutesAgo(now, 32), phase: 'E', activity: steve },
    { id: 1010, timestamp: minutesAgo(now, 28), phase: 'R', activity: belindaTest, message: 'Reproduced it' },
    { id: 1011, timestamp: minutesAgo(now, 23), phase: 'E', activity: nora },
    { id: 1012, timestamp: minutesAgo(now, 22), phase: 'E', activity: miles },
    { id: 1013, timestamp: minutesAgo(now, 20), phase: 'B', activity: human },
    { id: 1014, timestamp: minutesAgo(now, 16), phase: 'E', activity: belindaTest },
    { id: 1015, timestamp: minutesAgo(now, 12), phase: 'E', activity: belinda },
    { id: 1016, timestamp: minutesAgo(now, 10), phase: 'B', activity: deploy },
    { id: 1017, timestamp: minutesAgo(now, 6), phase: 'E', activity: human },
    { id: 1018, timestamp: minutesAgo(now, 4), phase: 'E', activity: deploy },
    { id: 1019, timestamp: minutesAgo(now, 2), phase: 'E', activity: sharedRoot },
  ]);
}

export function createParentSuspensionFixture(now = Date.now()): AppChartFixture {
  const app = thread(1, 'agent work 🤖');
  const parent = activity(app, 200, 'Implement streaming', {
    agentName: 'Ada',
    agentProvider: 'cursor',
  });
  const reader = activity(app, 201, 'Read channel code', {
    agentName: 'Ada',
    agentProvider: 'cursor',
    category: 2,
    parentId: parent.id,
  });
  const tests = activity(app, 202, 'Write reconnect tests', {
    agentName: 'Ada',
    agentProvider: 'cursor',
    parentId: parent.id,
  });

  return fixture(9200, 'Parent suspension', [app], [
    { id: 2001, timestamp: minutesAgo(now, 70), phase: 'B', activity: parent },
    { id: 2002, timestamp: minutesAgo(now, 65), phase: 'B', activity: reader },
    { id: 2003, timestamp: minutesAgo(now, 50), phase: 'E', activity: reader },
    { id: 2004, timestamp: minutesAgo(now, 46), phase: 'B', activity: tests },
    { id: 2005, timestamp: minutesAgo(now, 38), phase: 'S', activity: parent, message: 'Waiting for review' },
    { id: 2006, timestamp: minutesAgo(now, 22), phase: 'R', activity: parent, message: 'Review arrived' },
    { id: 2007, timestamp: minutesAgo(now, 10), phase: 'E', activity: tests },
  ]);
}

export function createResurrectionFixture(now = Date.now()): AppChartFixture {
  const app = thread(1, 'returned work 🧟');
  const migration = activity(app, 300, 'Remove legacy chart', {
    agentName: 'Mina',
    agentProvider: 'claude',
    category: 5,
  });
  const docs = activity(app, 301, 'Document package boundary', {
    agentName: 'Mina',
    agentProvider: 'claude',
    category: 3,
  });

  return fixture(9300, 'Resurrection', [app], [
    { id: 3001, timestamp: minutesAgo(now, 75), phase: 'B', activity: migration },
    { id: 3002, timestamp: minutesAgo(now, 58), phase: 'E', activity: migration, message: 'Thought this was done' },
    { id: 3003, timestamp: minutesAgo(now, 43), phase: 'X', activity: migration, message: 'Regression reopened it' },
    { id: 3004, timestamp: minutesAgo(now, 31), phase: 'E', activity: migration, message: 'Fixed again' },
    { id: 3005, timestamp: minutesAgo(now, 26), phase: 'X', activity: migration, message: 'One more consumer' },
    { id: 3006, timestamp: minutesAgo(now, 18), phase: 'B', activity: docs },
    { id: 3007, timestamp: minutesAgo(now, 8), phase: 'E', activity: docs },
  ]);
}

export function createStrangeSequenceFixture(now = Date.now()): AppChartFixture {
  const edgeCases = thread(1, 'edge cases 🧪');
  const duplicated = activity(edgeCases, 400, 'Duplicate lifecycle delivery', {
    agentName: 'Retrying client',
    agentProvider: 'cursor',
    category: 5,
  });
  const endBeforeBegin = activity(edgeCases, 401, 'End arrived before begin', { category: 2 });
  const resumeFirst = activity(edgeCases, 402, 'Resume without prior suspend', {
    agentName: 'Old client',
    agentProvider: 'codex',
    category: 3,
  });

  // Deliberately shuffled. processTrace must order by timestamp and tolerate
  // duplicate lifecycle events, an event without an activity, and odd phases.
  return fixture(9400, 'Strange event sequences', [edgeCases], [
    { id: 4008, timestamp: minutesAgo(now, 18), phase: 'R', activity: duplicated, message: 'Duplicate resume' },
    { id: 4002, timestamp: minutesAgo(now, 62), phase: 'S', activity: duplicated, message: 'Network dropped' },
    { id: 4005, timestamp: minutesAgo(now, 48), phase: 'E', activity: endBeforeBegin, message: 'End arrived first' },
    { id: 4001, timestamp: minutesAgo(now, 72), phase: 'B', activity: duplicated },
    { id: 4010, timestamp: minutesAgo(now, 12), phase: 'E', activity: duplicated },
    { id: 4006, timestamp: minutesAgo(now, 38), phase: 'B', activity: endBeforeBegin },
    { id: 4003, timestamp: minutesAgo(now, 60), phase: 'S', activity: duplicated, message: 'Duplicate suspend' },
    { id: 4004, timestamp: minutesAgo(now, 54), phase: 'R', activity: resumeFirst, message: 'No begin event' },
    { id: 4007, timestamp: minutesAgo(now, 28), phase: 'R', activity: duplicated, message: 'Back online' },
    { id: 4009, timestamp: minutesAgo(now, 16), phase: 'E', activity: endBeforeBegin },
    { id: 4011, timestamp: minutesAgo(now, 44), phase: 'B', activity: null, message: 'Missing activity payload' },
  ]);
}

export function createQuestionOutcomesFixture(now = Date.now()): AppChartFixture {
  const decisions = thread(1, 'decisions 🤔');
  const resolved = activity(decisions, 500, 'Should Storybook use app UI?', { category: 4 });
  const rejected = activity(decisions, 501, 'Rewrite the renderer again?', { category: 5 });
  const open = activity(decisions, 502, 'How should agent lanes collapse?', { category: 2 });

  return fixture(9500, 'Questions and outcomes', [decisions], [
    { id: 5001, timestamp: minutesAgo(now, 70), phase: 'Q', activity: resolved },
    { id: 5002, timestamp: minutesAgo(now, 48), phase: 'V', activity: resolved, message: 'Use fixture state' },
    { id: 5003, timestamp: minutesAgo(now, 43), phase: 'Q', activity: rejected },
    { id: 5004, timestamp: minutesAgo(now, 27), phase: 'J', activity: rejected, message: 'Keep the real chart' },
    { id: 5005, timestamp: minutesAgo(now, 18), phase: 'Q', activity: open },
  ]);
}

export function createDenseTraceFixture(now = Date.now()): AppChartFixture {
  const busy = thread(1, 'busy thread ⚡');
  const events: TraceEvent[] = [];

  for (let index = 0; index < 18; index += 1) {
    const item = activity(busy, 600 + index, `Tiny task ${index + 1}`, {
      agentName: ['Ari', 'Bo', 'Cy'][index % 3],
      agentProvider: (['cursor', 'claude', 'codex'] as const)[index % 3],
      category: (index % 5) + 1,
    });
    const start = 75 - index * 4;
    events.push(
      { id: 6000 + index * 2, timestamp: minutesAgo(now, start), phase: 'B', activity: item },
      { id: 6001 + index * 2, timestamp: minutesAgo(now, start - 2), phase: 'E', activity: item },
    );
  }

  return fixture(9600, 'Dense short work', [busy], events);
}

export function createSparseTraceFixture(now = Date.now()): AppChartFixture {
  const sparse = thread(1, 'slow burn 🐢');
  const long = activity(sparse, 700, 'Long-running migration', {
    agentName: 'Nora',
    agentProvider: 'codex',
    category: 4,
  });
  const recent = activity(sparse, 701, 'Quick verification', { category: 3 });

  return fixture(9700, 'Sparse long-running work', [sparse], [
    { id: 7001, timestamp: minutesAgo(now, 360), phase: 'B', activity: long },
    { id: 7002, timestamp: minutesAgo(now, 12), phase: 'B', activity: recent },
    { id: 7003, timestamp: minutesAgo(now, 7), phase: 'E', activity: recent },
  ]);
}

/** Short same-agent flames — close bursts coalesce; distant ones stay separate. */
export function createShortAgentFlamesFixture(now = Date.now()): AppChartFixture {
  const app = thread(1, 'flambe🔥');
  const root = activity(app, 800, 'Ship lane chrome', { category: 3 });
  const early = activity(app, 801, 'Sketch gutter', {
    agentName: 'Miles',
    agentProvider: 'claude',
    category: 1,
    parentId: root.id,
  });
  // Ends early; mid starts 3 minutes later (within a typical grid tick → coalesce).
  const mid = activity(app, 802, 'Tighten fork clearance', {
    agentName: 'Miles',
    agentProvider: 'claude',
    category: 2,
    parentId: root.id,
  });
  // Farther burst stays a separate flame.
  const late = activity(app, 803, 'Check Storybook', {
    agentName: 'Miles',
    agentProvider: 'claude',
    category: 1,
    parentId: root.id,
  });
  const nested = activity(app, 810, 'Nested review', {
    agentName: 'Belinda',
    agentProvider: 'cursor',
    category: 3,
    parentId: root.id,
  });
  const nestedChild = activity(app, 811, 'Deep check', {
    agentName: 'Nora',
    agentProvider: 'codex',
    category: 2,
    parentId: nested.id,
  });

  return fixture(9900, 'Short agent flames', [app], [
    { id: 8001, timestamp: minutesAgo(now, 90), phase: 'B', activity: root },
    { id: 8002, timestamp: minutesAgo(now, 85), phase: 'B', activity: early },
    { id: 8003, timestamp: minutesAgo(now, 80), phase: 'E', activity: early },
    { id: 8004, timestamp: minutesAgo(now, 77), phase: 'B', activity: mid },
    { id: 8005, timestamp: minutesAgo(now, 72), phase: 'E', activity: mid },
    { id: 8006, timestamp: minutesAgo(now, 40), phase: 'B', activity: nested },
    { id: 8007, timestamp: minutesAgo(now, 38), phase: 'B', activity: nestedChild },
    { id: 8008, timestamp: minutesAgo(now, 32), phase: 'E', activity: nestedChild },
    { id: 8009, timestamp: minutesAgo(now, 30), phase: 'E', activity: nested },
    { id: 8010, timestamp: minutesAgo(now, 18), phase: 'B', activity: late },
    { id: 8011, timestamp: minutesAgo(now, 14), phase: 'E', activity: late },
    { id: 8012, timestamp: minutesAgo(now, 5), phase: 'E', activity: root },
  ]);
}

export function createEmptyTraceFixture(): AppChartFixture {
  return fixture(9800, 'Empty trace', [thread(1, 'nothing yet')], []);
}
