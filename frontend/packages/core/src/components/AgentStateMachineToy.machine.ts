import { assign, setup } from 'xstate';
import type { Activity } from '../types/Activity';
import type { Thread } from '../types/Thread';
import type { TraceEvent, EventPhase } from '../types/TraceEvent';

export type AgentStateValue =
  | 'idle'
  | 'exploring'
  | 'executing'
  | 'consulting_reducer'
  | 'waiting_for_human'
  | 'suspended';

export interface StackEntry {
  id: number;
  name: string;
  parentId: number | null;
  categoryId: number;
  startedAt: number;
}

export interface TransitionRecord {
  id: number;
  from: AgentStateValue;
  to: AgentStateValue;
  event: string;
  detail: string;
  timestamp: number;
}

export interface AgentToyContext {
  agentId: string;
  agentName: string;
  thread: Thread;
  simTimeMs: number;
  stack: StackEntry[];
  activitiesById: Record<number, Activity>;
  traceEvents: TraceEvent[];
  nextActivityId: number;
  nextEventId: number;
  lastContactAgoSec: number;
  reducerDirection: 'continue' | 'pause' | 'escalate' | null;
  reducerReply: string | null;
  blockerQuestion: string | null;
  history: TransitionRecord[];
  nextTransitionId: number;
  previousState: AgentStateValue;
}

export type AgentToyEvent =
  | { type: 'START_ROOT'; name?: string }
  | { type: 'DIVE_DEEPER'; name?: string }
  | { type: 'LOCK_IN_PLAN'; name?: string }
  | { type: 'HIT_RABBIT_HOLE'; name?: string }
  | { type: 'POP_LEAF'; outcome?: string }
  | { type: 'ASK_REDUCER'; note?: string }
  | { type: 'REDUCER_CONTINUE'; reply?: string }
  | { type: 'REDUCER_ESCALATE'; question?: string }
  | { type: 'NEEDS_DECISION'; question?: string }
  | { type: 'HUMAN_REPLIED'; answer?: string }
  | { type: 'SUSPEND_WORK'; reason?: string }
  | { type: 'RESUME_WORK'; note?: string }
  | { type: 'FINISH_ALL'; summary?: string }
  | { type: 'HEARTBEAT' }
  | { type: 'TICK_SECOND' }
  | { type: 'RESET' };

const DEFAULT_ROOT_NAMES = [
  'Build XState agent demo',
  'Trace auth token refresh',
  'Refactor actor lane wash',
  'Fix offline queue flush',
];

const DEFAULT_SUB_NAMES = [
  'Read existing XState setup',
  'Check reducer edge cases',
  'Inspect SVG connector math',
  'Verify test harness',
];

const DEMO_THREAD: Thread = {
  id: 1,
  name: 'flambe 🔥 · agent state machine',
  rank: 0,
  collapsed: false,
};

const STEP_ADVANCE_MS = 90_000; // 1.5 simulated minutes per state transition so flame bars have visible width

function makeActivity(
  context: AgentToyContext,
  id: number,
  name: string,
  parentId: number | null,
  categoryId: number,
): Activity {
  return {
    id,
    name,
    thread: context.thread,
    thread_id: context.thread.id,
    parent_id: parentId,
    categories: [categoryId],
    agent_id: context.agentId,
    agent_name: context.agentName,
  };
}

function makeTraceEvent(
  id: number,
  activity: Activity,
  phase: EventPhase,
  timestamp: number,
  message?: string,
): TraceEvent {
  return {
    id,
    activity,
    phase,
    timestamp,
    ...(message ? { message } : {}),
  };
}

function appendTransition(
  context: AgentToyContext,
  to: AgentStateValue,
  event: string,
  detail: string,
  timestamp: number,
): Pick<AgentToyContext, 'history' | 'nextTransitionId' | 'previousState'> {
  const record: TransitionRecord = {
    id: context.nextTransitionId,
    from: context.previousState,
    to,
    event,
    detail,
    timestamp,
  };
  return {
    history: [record, ...context.history].slice(0, 24),
    nextTransitionId: context.nextTransitionId + 1,
    previousState: to,
  };
}

function buildInitialSeed(): AgentToyContext {
  const baseTime = Date.now() - 8 * 60_000;
  const rootAct: Activity = {
    id: 820,
    name: 'Build XState agent demo',
    thread: DEMO_THREAD,
    thread_id: DEMO_THREAD.id,
    parent_id: null,
    categories: [1],
    agent_id: 'cursor:ulla-4',
    agent_name: 'Ulla 4',
  };
  const childAct: Activity = {
    id: 821,
    name: 'Read existing XState setup',
    thread: DEMO_THREAD,
    thread_id: DEMO_THREAD.id,
    parent_id: 820,
    categories: [2],
    agent_id: 'cursor:ulla-4',
    agent_name: 'Ulla 4',
  };

  const t1 = baseTime;
  const t2 = baseTime + STEP_ADVANCE_MS;

  return {
    agentId: 'cursor:ulla-4',
    agentName: 'Ulla 4',
    thread: DEMO_THREAD,
    simTimeMs: t2,
    stack: [
      { id: 820, name: rootAct.name!, parentId: null, categoryId: 1, startedAt: t1 },
      { id: 821, name: childAct.name!, parentId: 820, categoryId: 2, startedAt: t2 },
    ],
    activitiesById: {
      820: rootAct,
      821: childAct,
    },
    traceEvents: [
      makeTraceEvent(5001, rootAct, 'B', t1, 'Started root workstream'),
      makeTraceEvent(5002, childAct, 'B', t2, 'Pushed exploration leaf'),
    ],
    nextActivityId: 822,
    nextEventId: 5003,
    lastContactAgoSec: 2,
    reducerDirection: null,
    reducerReply: null,
    blockerQuestion: null,
    history: [
      {
        id: 2,
        from: 'exploring',
        to: 'exploring',
        event: 'DIVE_DEEPER',
        detail: 'flambe start "Read existing XState setup" (push onto stack)',
        timestamp: t2,
      },
      {
        id: 1,
        from: 'idle',
        to: 'exploring',
        event: 'START_ROOT',
        detail: 'flambe start "Build XState agent demo" --root',
        timestamp: t1,
      },
    ],
    nextTransitionId: 3,
    previousState: 'exploring',
  };
}

export const agentToyMachine = setup({
  types: {
    context: {} as AgentToyContext,
    events: {} as AgentToyEvent,
  },
  guards: {
    hasParentOnStack: ({ context }) => context.stack.length > 1,
  },
}).createMachine({
  id: 'flambeAgentToy',
  initial: 'exploring',
  context: () => buildInitialSeed(),
  on: {
    HEARTBEAT: {
      actions: assign({
        lastContactAgoSec: () => 0,
      }),
    },
    TICK_SECOND: {
      actions: assign({
        lastContactAgoSec: ({ context }) => Math.min(context.lastContactAgoSec + 1, 120),
      }),
    },
    RESET: {
      target: '.idle',
      actions: assign(({ context }) => {
        const t = Date.now() - 6 * 60_000;
        return {
          simTimeMs: t,
          stack: [],
          activitiesById: {},
          traceEvents: [],
          lastContactAgoSec: 0,
          reducerDirection: null,
          reducerReply: null,
          blockerQuestion: null,
          ...appendTransition(context, 'idle', 'RESET', 'Cleared thread & reset to idle', t),
        };
      }),
    },
  },
  states: {
    idle: {
      on: {
        START_ROOT: {
          target: 'exploring',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            const id = context.nextActivityId;
            const name =
              event.name ||
              DEFAULT_ROOT_NAMES[id % DEFAULT_ROOT_NAMES.length];
            const act = makeActivity(context, id, name, null, 2);
            const ev = makeTraceEvent(context.nextEventId, act, 'B', t, name);
            const entry: StackEntry = {
              id,
              name,
              parentId: null,
              categoryId: 2,
              startedAt: t,
            };
            return {
              simTimeMs: t,
              stack: [entry],
              activitiesById: { ...context.activitiesById, [id]: act },
              traceEvents: [...context.traceEvents, ev],
              nextActivityId: id + 1,
              nextEventId: context.nextEventId + 1,
              lastContactAgoSec: 0,
              reducerDirection: null,
              reducerReply: null,
              blockerQuestion: null,
              ...appendTransition(
                context,
                'exploring',
                'START_ROOT',
                `flambe start "${name}" --root`,
                t,
              ),
            };
          }),
        },
      },
    },

    exploring: {
      on: {
        DIVE_DEEPER: {
          target: 'exploring',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            const id = context.nextActivityId;
            const parentId = context.stack[context.stack.length - 1]?.id ?? null;
            const name =
              event.name ||
              DEFAULT_SUB_NAMES[id % DEFAULT_SUB_NAMES.length];
            const act = makeActivity(context, id, name, parentId, 2);
            const ev = makeTraceEvent(context.nextEventId, act, 'B', t, name);
            const entry: StackEntry = {
              id,
              name,
              parentId,
              categoryId: 2,
              startedAt: t,
            };
            return {
              simTimeMs: t,
              stack: [...context.stack, entry],
              activitiesById: { ...context.activitiesById, [id]: act },
              traceEvents: [...context.traceEvents, ev],
              nextActivityId: id + 1,
              nextEventId: context.nextEventId + 1,
              lastContactAgoSec: 0,
              ...appendTransition(
                context,
                'exploring',
                'DIVE_DEEPER',
                `flambe start "${name}" (push child under #${parentId ?? 'root'})`,
                t,
              ),
            };
          }),
        },
        LOCK_IN_PLAN: {
          target: 'executing',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            const id = context.nextActivityId;
            const parentId = context.stack[context.stack.length - 1]?.id ?? null;
            const name = event.name || 'Implement chosen approach';
            const act = makeActivity(context, id, name, parentId, 1);
            const ev = makeTraceEvent(context.nextEventId, act, 'B', t, name);
            const entry: StackEntry = {
              id,
              name,
              parentId,
              categoryId: 1,
              startedAt: t,
            };
            return {
              simTimeMs: t,
              stack: [...context.stack, entry],
              activitiesById: { ...context.activitiesById, [id]: act },
              traceEvents: [...context.traceEvents, ev],
              nextActivityId: id + 1,
              nextEventId: context.nextEventId + 1,
              lastContactAgoSec: 0,
              ...appendTransition(
                context,
                'executing',
                'LOCK_IN_PLAN',
                `flambe start "${name}"`,
                t,
              ),
            };
          }),
        },
        ASK_REDUCER: {
          target: 'consulting_reducer',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            const leaf = context.stack[context.stack.length - 1];
            const act = leaf ? context.activitiesById[leaf.id] : null;
            const note = event.note || 'Scope looks wider than expected; check direction';
            const newEvents = act
              ? [
                  ...context.traceEvents,
                  makeTraceEvent(context.nextEventId, act, 'reducer_incoming', t, note),
                ]
              : context.traceEvents;
            return {
              simTimeMs: t,
              traceEvents: newEvents,
              nextEventId: context.nextEventId + (act ? 1 : 0),
              lastContactAgoSec: 0,
              reducerDirection: null,
              reducerReply: null,
              ...appendTransition(
                context,
                'consulting_reducer',
                'ASK_REDUCER',
                `flambe message "${note}"`,
                t,
              ),
            };
          }),
        },
        NEEDS_DECISION: {
          target: 'waiting_for_human',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            return {
              simTimeMs: t,
              blockerQuestion:
                event.question || 'Which state model should the toy machine show?',
              ...appendTransition(
                context,
                'waiting_for_human',
                'NEEDS_DECISION',
                'Surfaced decision checkpoint to human (bars stay open)',
                t,
              ),
            };
          }),
        },
        SUSPEND_WORK: {
          target: 'suspended',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            const leaf = context.stack[context.stack.length - 1];
            const act = leaf ? context.activitiesById[leaf.id] : null;
            const reason = event.reason || 'Tabling while priorities shift';
            const newEvents = act
              ? [...context.traceEvents, makeTraceEvent(context.nextEventId, act, 'S', t, reason)]
              : context.traceEvents;
            return {
              simTimeMs: t,
              traceEvents: newEvents,
              nextEventId: context.nextEventId + (act ? 1 : 0),
              lastContactAgoSec: 0,
              ...appendTransition(
                context,
                'suspended',
                'SUSPEND_WORK',
                `flambe suspend ${leaf?.id ?? ''} "${reason}"`,
                t,
              ),
            };
          }),
        },
        FINISH_ALL: {
          target: 'idle',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            let nextEvId = context.nextEventId;
            const endEvents: TraceEvent[] = [];
            for (let i = context.stack.length - 1; i >= 0; i -= 1) {
              const item = context.stack[i];
              const act = context.activitiesById[item.id];
              if (act) {
                endEvents.push(
                  makeTraceEvent(
                    nextEvId++,
                    act,
                    'E',
                    t + (context.stack.length - 1 - i) * 1000,
                    event.summary || 'Completed workstream',
                  ),
                );
              }
            }
            return {
              simTimeMs: t + context.stack.length * 1000,
              stack: [],
              traceEvents: [...context.traceEvents, ...endEvents],
              nextEventId: nextEvId,
              lastContactAgoSec: 0,
              ...appendTransition(
                context,
                'idle',
                'FINISH_ALL',
                `flambe end (${event.summary || 'Exploration answered the question'})`,
                t,
              ),
            };
          }),
        },
      },
    },

    executing: {
      on: {
        HIT_RABBIT_HOLE: {
          target: 'exploring',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            const id = context.nextActivityId;
            const parentId = context.stack[context.stack.length - 1]?.id ?? null;
            const name = event.name || 'Investigate unexpected test failure';
            const act = makeActivity(context, id, name, parentId, 5);
            const ev = makeTraceEvent(context.nextEventId, act, 'B', t, name);
            const entry: StackEntry = {
              id,
              name,
              parentId,
              categoryId: 5,
              startedAt: t,
            };
            return {
              simTimeMs: t,
              stack: [...context.stack, entry],
              activitiesById: { ...context.activitiesById, [id]: act },
              traceEvents: [...context.traceEvents, ev],
              nextActivityId: id + 1,
              nextEventId: context.nextEventId + 1,
              lastContactAgoSec: 0,
              ...appendTransition(
                context,
                'exploring',
                'HIT_RABBIT_HOLE',
                `flambe start "${name}" (digression push under #${parentId ?? 'root'})`,
                t,
              ),
            };
          }),
        },
        POP_LEAF: [
          {
            guard: 'hasParentOnStack',
            target: 'executing',
            actions: assign(({ context, event }) => {
              const t = context.simTimeMs + STEP_ADVANCE_MS;
              const popped = context.stack[context.stack.length - 1];
              const act = popped ? context.activitiesById[popped.id] : null;
              const outcome = event.outcome || 'Leaf complete; back to parent';
              const newEvents = act
                ? [...context.traceEvents, makeTraceEvent(context.nextEventId, act, 'E', t, outcome)]
                : context.traceEvents;
              return {
                simTimeMs: t,
                stack: context.stack.slice(0, -1),
                traceEvents: newEvents,
                nextEventId: context.nextEventId + (act ? 1 : 0),
                lastContactAgoSec: 0,
                ...appendTransition(
                  context,
                  'executing',
                  'POP_LEAF',
                  `flambe end ${popped?.id ?? ''} "${outcome}"`,
                  t,
                ),
              };
            }),
          },
          {
            target: 'idle',
            actions: assign(({ context, event }) => {
              const t = context.simTimeMs + STEP_ADVANCE_MS;
              const popped = context.stack[0];
              const act = popped ? context.activitiesById[popped.id] : null;
              const outcome = event.outcome || 'Root workstream finished';
              const newEvents = act
                ? [...context.traceEvents, makeTraceEvent(context.nextEventId, act, 'E', t, outcome)]
                : context.traceEvents;
              return {
                simTimeMs: t,
                stack: [],
                traceEvents: newEvents,
                nextEventId: context.nextEventId + (act ? 1 : 0),
                lastContactAgoSec: 0,
                ...appendTransition(
                  context,
                  'idle',
                  'POP_LEAF',
                  `flambe end ${popped?.id ?? ''} "${outcome}"`,
                  t,
                ),
              };
            }),
          },
        ],
        ASK_REDUCER: {
          target: 'consulting_reducer',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            const leaf = context.stack[context.stack.length - 1];
            const act = leaf ? context.activitiesById[leaf.id] : null;
            const note = event.note || 'Checking if we should widen scope before editing more files';
            const newEvents = act
              ? [
                  ...context.traceEvents,
                  makeTraceEvent(context.nextEventId, act, 'reducer_incoming', t, note),
                ]
              : context.traceEvents;
            return {
              simTimeMs: t,
              traceEvents: newEvents,
              nextEventId: context.nextEventId + (act ? 1 : 0),
              lastContactAgoSec: 0,
              reducerDirection: null,
              reducerReply: null,
              ...appendTransition(
                context,
                'consulting_reducer',
                'ASK_REDUCER',
                `flambe message "${note}"`,
                t,
              ),
            };
          }),
        },
        NEEDS_DECISION: {
          target: 'waiting_for_human',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            return {
              simTimeMs: t,
              blockerQuestion:
                event.question || 'Should we render a live thread flamechart inside the demo?',
              ...appendTransition(
                context,
                'waiting_for_human',
                'NEEDS_DECISION',
                'Blocked on human judgment before continuing implementation',
                t,
              ),
            };
          }),
        },
        SUSPEND_WORK: {
          target: 'suspended',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            const leaf = context.stack[context.stack.length - 1];
            const act = leaf ? context.activitiesById[leaf.id] : null;
            const reason = event.reason || 'Parking implementation for later';
            const newEvents = act
              ? [...context.traceEvents, makeTraceEvent(context.nextEventId, act, 'S', t, reason)]
              : context.traceEvents;
            return {
              simTimeMs: t,
              traceEvents: newEvents,
              nextEventId: context.nextEventId + (act ? 1 : 0),
              lastContactAgoSec: 0,
              ...appendTransition(
                context,
                'suspended',
                'SUSPEND_WORK',
                `flambe suspend ${leaf?.id ?? ''} "${reason}"`,
                t,
              ),
            };
          }),
        },
        FINISH_ALL: {
          target: 'idle',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            let nextEvId = context.nextEventId;
            const endEvents: TraceEvent[] = [];
            for (let i = context.stack.length - 1; i >= 0; i -= 1) {
              const item = context.stack[i];
              const act = context.activitiesById[item.id];
              if (act) {
                endEvents.push(
                  makeTraceEvent(
                    nextEvId++,
                    act,
                    'E',
                    t + (context.stack.length - 1 - i) * 1000,
                    event.summary || 'All open activities completed',
                  ),
                );
              }
            }
            return {
              simTimeMs: t + context.stack.length * 1000,
              stack: [],
              traceEvents: [...context.traceEvents, ...endEvents],
              nextEventId: nextEvId,
              lastContactAgoSec: 0,
              ...appendTransition(
                context,
                'idle',
                'FINISH_ALL',
                `flambe end (${event.summary || 'All open activities completed'})`,
                t,
              ),
            };
          }),
        },
      },
    },

    consulting_reducer: {
      on: {
        REDUCER_CONTINUE: {
          target: 'executing',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            const leaf = context.stack[context.stack.length - 1];
            const act = leaf ? context.activitiesById[leaf.id] : null;
            const reply =
              event.reply || 'Direction: continue. Keep the demo self-contained under the current activity.';
            const newEvents = act
              ? [
                  ...context.traceEvents,
                  makeTraceEvent(context.nextEventId, act, 'reducer_decision', t, reply),
                ]
              : context.traceEvents;
            return {
              simTimeMs: t,
              traceEvents: newEvents,
              nextEventId: context.nextEventId + (act ? 1 : 0),
              lastContactAgoSec: 0,
              reducerDirection: 'continue',
              reducerReply: reply,
              ...appendTransition(
                context,
                'executing',
                'REDUCER_CONTINUE',
                'Reducer returned direction: continue',
                t,
              ),
            };
          }),
        },
        REDUCER_ESCALATE: {
          target: 'waiting_for_human',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            const leaf = context.stack[context.stack.length - 1];
            const act = leaf ? context.activitiesById[leaf.id] : null;
            const reply = 'Direction: escalate — ask David before changing scope.';
            const newEvents = act
              ? [
                  ...context.traceEvents,
                  makeTraceEvent(context.nextEventId, act, 'reducer_decision', t, reply),
                ]
              : context.traceEvents;
            return {
              simTimeMs: t,
              traceEvents: newEvents,
              nextEventId: context.nextEventId + (act ? 1 : 0),
              lastContactAgoSec: 0,
              reducerDirection: 'escalate',
              reducerReply: reply,
              blockerQuestion:
                event.question || 'Reducer flagged scope drift: confirm direction with David?',
              ...appendTransition(
                context,
                'waiting_for_human',
                'REDUCER_ESCALATE',
                'Reducer returned direction: escalate → surface to human',
                t,
              ),
            };
          }),
        },
      },
    },

    waiting_for_human: {
      on: {
        HUMAN_REPLIED: {
          target: 'executing',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            return {
              simTimeMs: t,
              blockerQuestion: null,
              lastContactAgoSec: 0,
              ...appendTransition(
                context,
                'executing',
                'HUMAN_REPLIED',
                `Human answered: "${event.answer || 'Render a flamechart in a thread!'}"`,
                t,
              ),
            };
          }),
        },
        SUSPEND_WORK: {
          target: 'suspended',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            const leaf = context.stack[context.stack.length - 1];
            const act = leaf ? context.activitiesById[leaf.id] : null;
            const reason = event.reason || 'Waiting on external decision';
            const newEvents = act
              ? [...context.traceEvents, makeTraceEvent(context.nextEventId, act, 'S', t, reason)]
              : context.traceEvents;
            return {
              simTimeMs: t,
              traceEvents: newEvents,
              nextEventId: context.nextEventId + (act ? 1 : 0),
              blockerQuestion: null,
              lastContactAgoSec: 0,
              ...appendTransition(
                context,
                'suspended',
                'SUSPEND_WORK',
                `flambe suspend ${leaf?.id ?? ''} "${reason}"`,
                t,
              ),
            };
          }),
        },
      },
    },

    suspended: {
      on: {
        RESUME_WORK: {
          target: 'exploring',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            const leaf = context.stack[context.stack.length - 1];
            const act = leaf ? context.activitiesById[leaf.id] : null;
            const note = event.note || 'Decision arrived; picking work back up';
            const newEvents = act
              ? [...context.traceEvents, makeTraceEvent(context.nextEventId, act, 'R', t, note)]
              : context.traceEvents;
            return {
              simTimeMs: t,
              traceEvents: newEvents,
              nextEventId: context.nextEventId + (act ? 1 : 0),
              lastContactAgoSec: 0,
              ...appendTransition(
                context,
                'exploring',
                'RESUME_WORK',
                `flambe resume ${leaf?.id ?? ''} "${note}"`,
                t,
              ),
            };
          }),
        },
        FINISH_ALL: {
          target: 'idle',
          actions: assign(({ context, event }) => {
            const t = context.simTimeMs + STEP_ADVANCE_MS;
            let nextEvId = context.nextEventId;
            const endEvents: TraceEvent[] = [];
            for (let i = context.stack.length - 1; i >= 0; i -= 1) {
              const item = context.stack[i];
              const act = context.activitiesById[item.id];
              if (act) {
                endEvents.push(
                  makeTraceEvent(
                    nextEvId++,
                    act,
                    'E',
                    t + (context.stack.length - 1 - i) * 1000,
                    event.summary || 'Closed suspended workstream',
                  ),
                );
              }
            }
            return {
              simTimeMs: t + context.stack.length * 1000,
              stack: [],
              traceEvents: [...context.traceEvents, ...endEvents],
              nextEventId: nextEvId,
              lastContactAgoSec: 0,
              ...appendTransition(
                context,
                'idle',
                'FINISH_ALL',
                `flambe end (${event.summary || 'Closed suspended workstream'})`,
                t,
              ),
            };
          }),
        },
      },
    },
  },
});
