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
  { id: 3, name: 'review', color_background: '#a78bfa', color_text: '#000000' },
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

/**
 * Suspend a **root** → unrelated root work during the gap → resume while that
 * work is still open. Gap work must not appear nested under the resumed root
 * (they stay sibling roots). The resume stacks below concurrent work — current
 * attention sits at the bottom of the stack.
 */
export function createResumeDuringConcurrentWorkFixture(now = Date.now()): AppChartFixture {
  const app = thread(1, 'flambe🔥');
  // Thread root that suspends/resumes — the case that looked parental before.
  const suspended = activity(app, 250, 'Land SNL orbits', {
    agentName: 'Claude',
    agentProvider: 'claude',
    category: 1,
  });
  // Another root (not a child of Claude) — runs while Claude is suspended.
  const gapWork = activity(app, 251, 'Fix selected block offset', {
    agentName: 'Composer',
    agentProvider: 'cursor',
    category: 2,
  });
  const gapChild = activity(app, 252, 'Align FocusedBlock Y', {
    agentName: 'Composer',
    agentProvider: 'cursor',
    category: 2,
    parentId: gapWork.id,
  });

  return fixture(9250, 'Resume during concurrent work', [app], [
    { id: 2501, timestamp: minutesAgo(now, 75), phase: 'B', activity: suspended },
    { id: 2502, timestamp: minutesAgo(now, 55), phase: 'S', activity: suspended, message: 'Waiting on product' },
    { id: 2503, timestamp: minutesAgo(now, 50), phase: 'B', activity: gapWork },
    { id: 2504, timestamp: minutesAgo(now, 45), phase: 'B', activity: gapChild },
    { id: 2505, timestamp: minutesAgo(now, 30), phase: 'E', activity: gapChild },
    { id: 2506, timestamp: minutesAgo(now, 25), phase: 'R', activity: suspended, message: 'Back to orbits' },
    { id: 2507, timestamp: minutesAgo(now, 12), phase: 'E', activity: gapWork },
    { id: 2508, timestamp: minutesAgo(now, 8), phase: 'E', activity: suspended },
  ]);
}

/** Same root suspend→gap→resume shape, all human. Resume stacks below the gap work. */
export function createHumanResumeDuringConcurrentWorkFixture(now = Date.now()): AppChartFixture {
  const app = thread(1, 'planning 📋');
  const suspended = activity(app, 260, 'Draft release notes', { category: 1 });
  // Another root — runs while notes are suspended.
  const gapWork = activity(app, 261, 'Triage support inbox', { category: 2 });
  const gapChild = activity(app, 262, 'Reply to billing question', {
    category: 4,
    parentId: gapWork.id,
  });

  return fixture(9260, 'Human resume during concurrent work', [app], [
    { id: 2601, timestamp: minutesAgo(now, 75), phase: 'B', activity: suspended },
    { id: 2602, timestamp: minutesAgo(now, 55), phase: 'S', activity: suspended, message: 'Waiting on screenshots' },
    { id: 2603, timestamp: minutesAgo(now, 50), phase: 'B', activity: gapWork },
    { id: 2604, timestamp: minutesAgo(now, 45), phase: 'B', activity: gapChild },
    { id: 2605, timestamp: minutesAgo(now, 30), phase: 'E', activity: gapChild },
    { id: 2606, timestamp: minutesAgo(now, 25), phase: 'R', activity: suspended, message: 'Screenshots arrived' },
    { id: 2607, timestamp: minutesAgo(now, 12), phase: 'E', activity: gapWork },
    { id: 2608, timestamp: minutesAgo(now, 8), phase: 'E', activity: suspended },
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

/** Short same-agent flames — all owned work shares one sustained wash. */
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

/**
 * Independent `--root` agent flames interleaved with human work — the shape of
 * a live afternoon where several agents each own scattered bursts. Chrome
 * should read as one sustained wash per agent, not a labeled island per burst.
 */
export function createIndependentAgentRootsFixture(now = Date.now()): AppChartFixture {
  const app = thread(1, 'flambe🔥');
  const humanRoot = activity(app, 900, 'Ship timeline chrome', { category: 3 });
  const theo = activity(app, 901, 'Reinstate presence', {
    agentName: 'Theo',
    agentProvider: 'cursor',
    category: 1,
  });
  const theoChild = activity(app, 902, 'Wire session names', {
    agentName: 'Theo',
    agentProvider: 'cursor',
    category: 1,
    parentId: theo.id,
  });
  const ottoEarly = activity(app, 910, 'Plot observations', {
    agentName: 'Otto',
    agentProvider: 'cursor',
    category: 1,
  });
  const cg4Early = activity(app, 920, 'Add default cluster assignment', {
    agentName: 'CG4',
    agentProvider: 'cursor',
    category: 1,
  });
  const cg4Child = activity(app, 921, 'Finish migrate', {
    agentName: 'CG4',
    agentProvider: 'cursor',
    category: 1,
    parentId: cg4Early.id,
  });
  const humanDb = activity(app, 930, 'Optional remote DB for local Phoenix', {
    category: 4,
    parentId: humanRoot.id,
  });
  const ottoMid = activity(app, 911, 'Wire chart overlay', {
    agentName: 'Otto',
    agentProvider: 'cursor',
    category: 1,
  });
  const redesign = activity(app, 940, 'Redesign category UI', {
    agentName: 'Cleo',
    agentProvider: 'claude',
    category: 1,
  });
  const ottoLate = activity(app, 912, 'Add remaining ticks', {
    agentName: 'Otto',
    agentProvider: 'cursor',
    category: 2,
  });
  const cg4Late = activity(app, 922, 'Add default action user', {
    agentName: 'CG4',
    agentProvider: 'cursor',
    category: 1,
  });
  const cg4LateChild = activity(app, 923, 'Backfill clusters on Fly', {
    agentName: 'CG4',
    agentProvider: 'cursor',
    category: 1,
    parentId: cg4Late.id,
  });
  const when = activity(app, 950, 'Add modal', {
    agentName: 'When',
    agentProvider: 'claude',
    category: 1,
  });

  return fixture(9910, 'Independent agent roots', [app], [
    { id: 9001, timestamp: minutesAgo(now, 80), phase: 'B', activity: humanRoot },
    { id: 9002, timestamp: minutesAgo(now, 79), phase: 'B', activity: theo },
    { id: 9003, timestamp: minutesAgo(now, 78), phase: 'B', activity: theoChild },
    { id: 9004, timestamp: minutesAgo(now, 76), phase: 'E', activity: theoChild },
    { id: 9005, timestamp: minutesAgo(now, 75), phase: 'E', activity: theo },
    { id: 9006, timestamp: minutesAgo(now, 70), phase: 'B', activity: ottoEarly },
    { id: 9007, timestamp: minutesAgo(now, 67), phase: 'E', activity: ottoEarly },
    { id: 9008, timestamp: minutesAgo(now, 68), phase: 'B', activity: cg4Early },
    { id: 9009, timestamp: minutesAgo(now, 66), phase: 'B', activity: cg4Child },
    { id: 9010, timestamp: minutesAgo(now, 63), phase: 'E', activity: cg4Child },
    { id: 9011, timestamp: minutesAgo(now, 62), phase: 'E', activity: cg4Early },
    { id: 9012, timestamp: minutesAgo(now, 60), phase: 'B', activity: humanDb },
    { id: 9013, timestamp: minutesAgo(now, 58), phase: 'B', activity: ottoMid },
    { id: 9014, timestamp: minutesAgo(now, 55), phase: 'E', activity: ottoMid },
    { id: 9015, timestamp: minutesAgo(now, 48), phase: 'E', activity: humanDb },
    { id: 9016, timestamp: minutesAgo(now, 45), phase: 'B', activity: redesign },
    { id: 9017, timestamp: minutesAgo(now, 42), phase: 'B', activity: ottoLate },
    { id: 9018, timestamp: minutesAgo(now, 39), phase: 'E', activity: ottoLate },
    { id: 9019, timestamp: minutesAgo(now, 36), phase: 'E', activity: redesign },
    { id: 9020, timestamp: minutesAgo(now, 22), phase: 'B', activity: cg4Late },
    { id: 9021, timestamp: minutesAgo(now, 20), phase: 'B', activity: cg4LateChild },
    { id: 9022, timestamp: minutesAgo(now, 16), phase: 'E', activity: cg4LateChild },
    { id: 9023, timestamp: minutesAgo(now, 15), phase: 'E', activity: cg4Late },
    { id: 9024, timestamp: minutesAgo(now, 12), phase: 'B', activity: when },
    { id: 9025, timestamp: minutesAgo(now, 8), phase: 'E', activity: when },
    { id: 9026, timestamp: minutesAgo(now, 4), phase: 'E', activity: humanRoot },
  ]);
}

/**
 * Several agents each running a deep, simultaneous same-agent stack (root →
 * child → grandchild), all concurrent. Each agent's wash should contain its
 * whole stack as one envelope, and the bands should not overlap.
 */
export function createStackedAgentWorkFixture(now = Date.now()): AppChartFixture {
  const app = thread(1, 'flambe🔥');
  const humanRoot = activity(app, 1000, 'Ship the reducer rewrite', { category: 3 });

  const adaRoot = activity(app, 1100, 'Refactor reducer core', {
    agentName: 'Ada', agentProvider: 'cursor', category: 1, parentId: humanRoot.id,
  });
  const adaMid = activity(app, 1101, 'Extract action handlers', {
    agentName: 'Ada', agentProvider: 'cursor', category: 1, parentId: adaRoot.id,
  });
  const adaDeep = activity(app, 1102, 'Rewrite dispatch loop', {
    agentName: 'Ada', agentProvider: 'cursor', category: 2, parentId: adaMid.id,
  });

  const boRoot = activity(app, 1200, 'Harden socket layer', {
    agentName: 'Bo', agentProvider: 'claude', category: 1, parentId: humanRoot.id,
  });
  const boMid = activity(app, 1201, 'Add reconnect backoff', {
    agentName: 'Bo', agentProvider: 'claude', category: 5, parentId: boRoot.id,
  });
  const boDeep = activity(app, 1202, 'Probe the race window', {
    agentName: 'Bo', agentProvider: 'claude', category: 2, parentId: boMid.id,
  });

  const cyRoot = activity(app, 1300, 'Migrate the schema', {
    agentName: 'Cy', agentProvider: 'codex', category: 4, parentId: humanRoot.id,
  });
  const cyMid = activity(app, 1301, 'Backfill rows', {
    agentName: 'Cy', agentProvider: 'codex', category: 4, parentId: cyRoot.id,
  });
  const cyDeep = activity(app, 1302, 'Verify constraints', {
    agentName: 'Cy', agentProvider: 'codex', category: 2, parentId: cyMid.id,
  });

  const deeRoot = activity(app, 1400, 'Audit telemetry', {
    agentName: 'Dee', agentProvider: 'grok', category: 3, parentId: humanRoot.id,
  });
  const deeMid = activity(app, 1401, 'Tag spans', {
    agentName: 'Dee', agentProvider: 'grok', category: 3, parentId: deeRoot.id,
  });

  return fixture(9930, 'Stacked agent work', [app], [
    { id: 9301, timestamp: minutesAgo(now, 60), phase: 'B', activity: humanRoot },
    { id: 9302, timestamp: minutesAgo(now, 55), phase: 'B', activity: adaRoot },
    { id: 9303, timestamp: minutesAgo(now, 54), phase: 'B', activity: boRoot },
    { id: 9304, timestamp: minutesAgo(now, 53), phase: 'B', activity: cyRoot },
    { id: 9305, timestamp: minutesAgo(now, 52), phase: 'B', activity: deeRoot },
    { id: 9306, timestamp: minutesAgo(now, 51), phase: 'B', activity: adaMid },
    { id: 9307, timestamp: minutesAgo(now, 50), phase: 'B', activity: boMid },
    { id: 9308, timestamp: minutesAgo(now, 50), phase: 'B', activity: cyMid },
    { id: 9309, timestamp: minutesAgo(now, 49), phase: 'B', activity: deeMid },
    { id: 9310, timestamp: minutesAgo(now, 48), phase: 'B', activity: adaDeep },
    { id: 9311, timestamp: minutesAgo(now, 47), phase: 'B', activity: boDeep },
    { id: 9312, timestamp: minutesAgo(now, 46), phase: 'B', activity: cyDeep },
    { id: 9313, timestamp: minutesAgo(now, 24), phase: 'E', activity: adaDeep },
    { id: 9314, timestamp: minutesAgo(now, 23), phase: 'E', activity: boDeep },
    { id: 9315, timestamp: minutesAgo(now, 22), phase: 'E', activity: cyDeep },
    { id: 9316, timestamp: minutesAgo(now, 21), phase: 'E', activity: deeMid },
    { id: 9317, timestamp: minutesAgo(now, 20), phase: 'E', activity: adaMid },
    { id: 9318, timestamp: minutesAgo(now, 19), phase: 'E', activity: boMid },
    { id: 9319, timestamp: minutesAgo(now, 18), phase: 'E', activity: cyMid },
    { id: 9320, timestamp: minutesAgo(now, 17), phase: 'E', activity: deeRoot },
    { id: 9321, timestamp: minutesAgo(now, 16), phase: 'E', activity: adaRoot },
    { id: 9322, timestamp: minutesAgo(now, 15), phase: 'E', activity: boRoot },
    { id: 9323, timestamp: minutesAgo(now, 14), phase: 'E', activity: cyRoot },
    { id: 9324, timestamp: minutesAgo(now, 6), phase: 'E', activity: humanRoot },
  ]);
}

export function createEmptyTraceFixture(): AppChartFixture {
  return fixture(9800, 'Empty trace', [thread(1, 'nothing yet')], []);
}

function planned(
  owner: Thread,
  id: EntityId,
  name: string,
  options: { category?: EntityId; start?: number; end?: number; weight?: number; parentId?: EntityId } = {},
): Activity {
  return {
    ...activity(owner, id, name, { category: options.category, parentId: options.parentId }),
    scheduled_start: options.start ?? null,
    scheduled_end: options.end ?? null,
    ...(options.weight === undefined ? {} : { weight: options.weight }),
  };
}

/** Lived work up to now, then scheduled plans to the right of now (ADR-017). */
export function createScheduledActivitiesFixture(now = Date.now()): AppChartFixture {
  const app = thread(1, 'flambé🔥');
  const van = thread(2, 'sell van 🚐', 1);

  const lived = activity(app, 2701, 'Persist scheduled times', { category: 1 });
  const livedChild = activity(app, 2702, 'Write the migration', { category: 1, parentId: lived.id });

  const base = fixture(9950, 'Scheduled activities', [app, van], [
    { id: 9951, timestamp: minutesAgo(now, 90), phase: 'B', activity: lived },
    { id: 9952, timestamp: minutesAgo(now, 80), phase: 'B', activity: livedChild },
    { id: 9953, timestamp: minutesAgo(now, 40), phase: 'E', activity: livedChild },
    { id: 9954, timestamp: minutesAgo(now, 20), phase: 'E', activity: lived },
  ]);

  return {
    ...base,
    unstarted: [
      planned(app, 2710, 'Review the limbo pane', {
        category: 3, start: now + 20 * MINUTE, end: now + 80 * MINUTE,
      }),
      planned(app, 2711, 'Ship it (deadline)', { category: 4, end: now + 150 * MINUTE }),
      planned(van, 2712, 'List the van', { category: 4, start: now + 60 * MINUTE }),
      planned(van, 2713, 'Past plan, still unstarted', {
        category: 5, start: minutesAgo(now, 70), end: minutesAgo(now, 50),
      }),
    ],
  };
}

/** Unstarted work with no time, next to suspended work: both are limbo. */
export function createLimboFixture(now = Date.now()): AppChartFixture {
  const app = thread(1, 'flambé🔥');
  const van = thread(2, 'sell van 🚐', 1);

  const paused = { ...activity(app, 2801, 'Rework reducer placement', { category: 2 }), weight: 5 };
  const pausedUnweighted = activity(van, 2802, 'Touch up scratch on rear', { category: 4 });
  const running = activity(app, 2803, 'Write stories', { category: 3 });

  const base = fixture(9960, 'Limbo', [app, van], [
    { id: 9961, timestamp: minutesAgo(now, 120), phase: 'B', activity: paused },
    { id: 9962, timestamp: minutesAgo(now, 90), phase: 'S', activity: paused, message: 'Waiting on a decision' },
    { id: 9963, timestamp: minutesAgo(now, 100), phase: 'B', activity: pausedUnweighted },
    { id: 9964, timestamp: minutesAgo(now, 70), phase: 'S', activity: pausedUnweighted },
    { id: 9965, timestamp: minutesAgo(now, 30), phase: 'B', activity: running },
  ]);

  return {
    ...base,
    unstarted: [
      planned(app, 2810, 'Bring back the hex field', { category: 3, weight: 8 }),
      planned(app, 2811, 'Write a CLI walkthrough', { category: 3, weight: 2 }),
      planned(van, 2812, 'Detail the interior', { category: 4, weight: 3 }),
      planned(app, 2813, 'Maybe a mobile view', { category: 2 }),
      planned(van, 2814, 'Find a buyer', { category: 4 }),
    ],
  };
}
