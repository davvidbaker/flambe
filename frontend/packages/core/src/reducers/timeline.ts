import {
  map,
  uniq,
  omit,
  mapKeys,
  mapValues,
  remove,
  filter,
  omitBy,
  memoize,
} from 'lodash/fp';

import {
  ACTIVITY_CREATE_B,
  ACTIVITY_CREATE_Q,
  ACTIVITY_DELETE,
  ACTIVITY_END,
  ACTIVITY_RESUME,
  ACTIVITY_RESURRECT,
  ACTIVITY_SUSPEND,
  ACTIVITY_UPDATE,
  BLOCK_FOCUS,
  BLOCK_HOVER,
  CATEGORY_CREATE,
  PROCESS_TIMELINE_TRACE,
  // UPDATE_THREAD_LEVEL,
  DELETE_CURRENT_TRACE,
  THREAD_CREATE,
  THREAD_DELETE,
  THREAD_COLLAPSE,
  THREAD_EXPAND,
  THREAD_HIDE,
  THREAD_UPDATE,
  THREADS_COLLAPSE_ALL,
  THREADS_EXPAND_ALL,
  THREADS_REORDER,
  TIMELINE_ZOOM,
  TIMELINE_PAN,
  TIMELINE_SET,
  TRACE_SELECT,
  TRACE_FETCH,
  TRACE_FILTER,
} from '../actions';
import zoom from '../utilities/zoom';
import pan from '../utilities/pan';
import processTrace, { terminateBlock, type ProcessedActivity, type ThreadLevel, type TraceBlock } from '../utilities/processTrace';
import { getFilteredThreads } from '../utilities/timeline';
import type { EntityId } from '../types/ids';
import type { EventPhase, TraceEvent } from '../types/TraceEvent';
import type { Thread } from '../types/Thread';
import type { Trace } from '../types/Trace';

type TimelineAction = { type: string; [key: string]: any };
type AnyRecord = Record<string, any>;
const mapRecord = (record: AnyRecord, mapper: (value: any, key: string) => any): AnyRecord =>
  Object.fromEntries(Object.entries(record).map(([key, value]) => [key, mapper(value, key)]));
const omitRecord = (record: AnyRecord, keys: EntityId[]): AnyRecord => {
  const omitted = new Set(keys.map(String));
  return Object.fromEntries(Object.entries(record).filter(([key]) => !omitted.has(key)));
};

function numericIds(ids: unknown): EntityId[] {
  if (!Array.isArray(ids)) return [];
  return ids.map(id => Number(id)).filter(id => Number.isFinite(id));
}

function knownThreadIds(threads: Record<string, Thread>): EntityId[] {
  return Object.keys(threads).map(Number).filter(id => Number.isFinite(id));
}

function nextHiddenThreadIds(
  requested: unknown,
  threads: Record<string, Thread>,
  current: EntityId[],
): EntityId[] {
  const known = new Set(knownThreadIds(threads).map(String));
  const next = numericIds(requested).filter(id => known.has(String(id)));
  if (known.size > 0 && next.length >= known.size) return current;
  return next;
}

/** Activity id plus all descendants via parent_id (same-thread forest). */
function activitySubtreeIds(
  rootId: EntityId,
  activities: Record<string, ProcessedActivity>,
): string[] {
  const ids = [String(rootId)];
  let grew = true;
  while (grew) {
    grew = false;
    for (const [key, activity] of Object.entries(activities)) {
      if (ids.includes(key)) continue;
      if (activity.parent_id !== null && activity.parent_id !== undefined
        && ids.includes(String(activity.parent_id))) {
        ids.push(key);
        grew = true;
      }
    }
  }
  return ids;
}

/** Nearest ancestor of `moved` that remains on `moved`'s thread (ADR-002). */
function remainingSameThreadParent(
  moved: ProcessedActivity,
  activities: Record<string, ProcessedActivity>,
): EntityId | null {
  const sourceThread = String(moved.thread_id);
  let parentId = moved.parent_id ?? null;
  const seen = new Set<string>();
  while (parentId !== null && parentId !== undefined && !seen.has(String(parentId))) {
    seen.add(String(parentId));
    const parent = activities[String(parentId)];
    if (!parent) return null;
    if (String(parent.thread_id) === sourceThread) return parent.id;
    parentId = parent.parent_id ?? null;
  }
  return null;
}

export const getTimeline = (state: any): any => state.timeline;
export const getFilterExcludes = (state: any): EntityId[] => state.timeline.trace?.filterExcludes ?? [];

export const getTimelineWithFiltersApplied = (state: any): any => {
  const filterExcludes = getFilterExcludes(state) || [];
  const timeline = getTimeline(state);
  const excluded = new Set(filterExcludes.map(String));

  const activities = Object.fromEntries(Object.entries(timeline.activities).filter(([, activity]: [string, any]) => !excluded.has(String(activity.thread_id))));

  return {
    ...timeline,
    activities,
    blocks: timeline.blocks.filter((b: any) =>
      Object.keys(activities)
        .map(k => Number(k))
        .includes(b.activity_id),
    ),
    threads: getFilteredThreads(filterExcludes, timeline.threads),
    lastThread_id: excluded.has(String(state.lastThread_id))
      ? state.lastThread_id
      : null,
    threadLevels: getFilteredThreads(filterExcludes, timeline.threadLevels),
  };
};

export interface TimelineState {
  trace: { id: EntityId | null; name: string | null; filterExcludes: EntityId[] } | null;
  activities: Record<string, ProcessedActivity>;
  blocks: TraceBlock[];
  events: TraceEvent[];
  threads: Record<string, Thread>;
  threadLevels: Record<string, ThreadLevel>;
  focusedBlockIndex: number | null;
  focusedBlockActivity_id: EntityId | null;
  hoveredBlockIndex?: number | null;
  hoveredBlockActivity_id?: EntityId | null;
  leftBoundaryTime: number;
  rightBoundaryTime: number;
  flameChartTopOffset: number;
  minTime?: number;
  maxTime?: number;
  lastThread_id: EntityId | null;
  lastCategory_id: EntityId | null;
  thread_id?: EntityId;
}

const initialState: TimelineState = {
  trace: {
    id: null,
    name: null,
    filterExcludes: [],
  },
  focusedBlockIndex: null,
  focusedBlockActivity_id: null,
  activities: {},
  blocks: [],
  events: [],
  threads: {},
  threadLevels: {},
  leftBoundaryTime: 0,
  rightBoundaryTime: 0,
  flameChartTopOffset: 0,
  lastThread_id: null,
  lastCategory_id: null,
};

function updateThreadLevels(thread_id: EntityId, delta: number, threadLevels: AnyRecord): AnyRecord {
  const threadLevel = threadLevels[thread_id];
  return {
    ...threadLevels,
    [thread_id]: {
      current: threadLevel.current + delta,
      max:
        delta > 0
          ? Math.max(threadLevel.current + delta, threadLevel.max)
          : threadLevel.max,
    },
  };
}

function createBlock(
  blocks: any[] | undefined,
  thread_id: EntityId,
  timestamp: number,
  threadLevels: AnyRecord,
  activity_id: EntityId = 'optimisticActivity',
  beginning: EventPhase = 'B',
  event_id: EntityId = 'optimisticEvent',
) {
  // eslint-disable-next-line no-param-reassign
  blocks = blocks || [];
  return {
    blocks: [
      ...blocks,
      {
        level: threadLevels[thread_id].current,
        startTime: timestamp,
        activity_id,
        beginning,
        events: [event_id]
      },
    ],
    threadLevels: updateThreadLevels(thread_id, 1, threadLevels),
  };
}

function timeline(state: TimelineState = initialState, action: TimelineAction): TimelineState {
  switch (action.type) {
    case `${TRACE_FETCH}_SUCCEEDED`:
      return { ...state, trace: { ...state.trace, ...action.data } };

    case TIMELINE_ZOOM:
      const { leftBoundaryTime, rightBoundaryTime } = zoom(
        action.deltaY,
        action.zoomCenter,
        action.zoomCenterTime,
        action.leftBoundaryTime,
        action.rightBoundaryTime,
        action.width,
        action.nowTime,
        action.minTime,
      );
      return {
        ...state,
        leftBoundaryTime,
        rightBoundaryTime,
      };

    case TIMELINE_PAN:
      const { leftBoundaryTime: lBT, rightBoundaryTime: rBT, topOffset } = pan(
        action.deltaX,
        action.deltaY,
        action.leftBoundaryTime,
        action.rightBoundaryTime,
        action.width,
        action.topOffset,
        action.nowTime,
        action.minTime,
      );
      return {
        ...state,
        leftBoundaryTime: lBT,
        rightBoundaryTime: rBT,
        flameChartTopOffset: topOffset,
      };

    case PROCESS_TIMELINE_TRACE:
      const {
        activities,
        blocks,
        min,
        max,
        threadLevels,
        threads,
        lastCategory_id,
        lastThread_id,
        events,
      } = processTrace(action.events, action.threads, action.unstarted ?? []);

      return {
        ...state,
        minTime: min - 1000 * 60 * 10, // 10 minutes before the beginning
        maxTime: max,
        activities,
        blocks,
        threadLevels,
        threads,
        lastCategory_id: lastCategory_id ?? null,
        lastThread_id: lastThread_id ?? null,
        events,
      };

    /* Attention-driven order is a display projection; it must not rewrite persisted rank. */
    case TRACE_SELECT:
      return {
        ...state,
        trace: {
          id: action.trace.id ?? null,
          name: action.trace.name ?? null,
          filterExcludes: numericIds(action.trace.filterExcludes),
        },
      };

    case TRACE_FILTER:
      return {
        ...state,
        trace: {
          id: state.trace?.id ?? null,
          name: state.trace?.name ?? null,
          filterExcludes: nextHiddenThreadIds(
            action.filterExcludes,
            state.threads,
            state.trace?.filterExcludes ?? [],
          ),
        },
      };

    case THREAD_HIDE: {
      const hidden = new Set((state.trace?.filterExcludes ?? []).map(String));
      hidden.add(String(action.id));
      return {
        ...state,
        trace: {
          id: state.trace?.id ?? null,
          name: state.trace?.name ?? null,
          filterExcludes: nextHiddenThreadIds(
            [...hidden],
            state.threads,
            state.trace?.filterExcludes ?? [],
          ),
        },
      };
    }

    case THREADS_REORDER: {
      const ranks = Object.fromEntries(
        numericIds(action.orderedIds).map((id, index) => [String(id), index]),
      );
      return {
        ...state,
        threads: mapRecord(state.threads, (thread, key) => (
          ranks[key] === undefined ? thread : { ...thread, rank: ranks[key] }
        )),
      };
    }

    case DELETE_CURRENT_TRACE:
      return {
        ...state,
        trace: null,
      };

    // pretty sure I don't need this anymore
    // case UPDATE_THREAD_LEVEL:
    //   const prevLevel = state.threadLevels[action.id].current;
    //   const prevMax = state.threadLevels[action.id].max;
    //   return {
    //     ...state,
    //     threadLevels: updateThreadLevels(action.id){
    //       ...state.threadLevels,
    //       [action.id]: {
    //         current: prevLevel + action.inc,
    //         max: Math.max(prevLevel + action.inc, prevMax)
    //       }
    //     }
    //   };

    // 😃 optimism!
    case ACTIVITY_CREATE_B:
    case ACTIVITY_CREATE_Q:
      return {
        ...state,
        lastThread_id: action.thread_id,
        activities: {
          ...state.activities,
          optimisticActivity: {
            id: 'optimisticActivity',
            name: action.name,
            flavor: action.phase === 'Q' ? 'question' : 'task',
            startTime: action.timestamp,
            categories: [action.category_id],
            status: 'active',
            thread_id: action.thread_id,
            events: [],
            suspendedChildren: [],
          },
        },
        ...createBlock(
          state.blocks,
          action.thread_id,
          action.timestamp,
          state.threadLevels,
        ),
      };

    case `${ACTIVITY_CREATE_B}_SUCCEEDED`:
    case `${ACTIVITY_CREATE_Q}_SUCCEEDED`:
      return {
        ...state,
        blocks: state.blocks.map((block: any) =>
          block.activity_id === 'optimisticActivity'
            ? {
                ...block,
                activity_id: action.data.activity.id,
                events: [action.data.event.id],
              }
            : block,
        ),
        activities: Object.fromEntries(Object.entries(state.activities).map(([key, value]) => [key === 'optimisticActivity' ? action.data.activity.id : key, value])),
      };

    case ACTIVITY_RESUME:
      return {
        ...state,
        activities: {
          ...state.activities,
          [action.id]: {
            ...state.activities[action.id],
            endTime: action.timestamp,
            status: 'active',
          },
        },
        ...createBlock(
          state.blocks,
          action.thread_id,
          action.timestamp,
          state.threadLevels,
          action.id,
          'R',
          'optimisticResumeEvent',
        ),
      };
    case `${ACTIVITY_RESUME}_SUCCEEDED`:
      return {
        ...state,
        blocks: state.blocks.map((b: any) =>
          b.events.includes('optimisticResumeEvent')
            ? { ...b, events: b.events.map((_e: EntityId) => action.data.id) }
            : b,
        ),
      };

    case ACTIVITY_RESURRECT:
      return {
        ...state,
        activities: {
          ...state.activities,
          [action.id]: {
            ...state.activities[action.id],
            endTime: action.timestamp,
            status: 'active',
          },
        },
        ...createBlock(
          state.blocks,
          action.thread_id,
          action.timestamp,
          state.threadLevels,
          action.id,
          'X',
        ),
      };

    case ACTIVITY_DELETE:
      const remainingBlocks = state.blocks.filter(
        (block: any) => block.activity_id !== action.id,
      );
      const activityBlocks = state.blocks.filter(
        (block: any) => block.activity_id === action.id,
      );

      /** 💁 we need to adjust the levels of any affected blocks */
      for (let i = 0; i < remainingBlocks.length; i++) {
        if (
          state.activities[remainingBlocks[i].activity_id].thread_id ===
          action.thread_id
        ) {
          for (let j = 0; j < activityBlocks.length; j++) {
            // if the deleted block hasn't ended...
            if (!activityBlocks[j].endTime) {
              // ... and there are blocks below it...
              if (activityBlocks[j].startTime < remainingBlocks[i].startTime) {
                // ... those blocks need to move down a level
                remainingBlocks[i].level--;
              }
            } else if (
              activityBlocks[j].startTime < remainingBlocks[i].startTime &&
              (activityBlocks[j].endTime ?? Infinity) > (remainingBlocks[i].endTime ?? Infinity)
            ) {
              remainingBlocks[i].level--;
            }
          }
        }
      }

      return {
        ...state,
        activities: omitRecord(state.activities, [action.id]),

        focusedBlockIndex: null,
        focusedBlockActivity_id: null,
        lastThread_id: action.thread_id,
        /** 💁 if the activity hasn't ended, we need to adjust thread level for the future */
        blocks: remainingBlocks,
        threadLevels: updateThreadLevels(
          action.thread_id,
          -1,
          state.threadLevels,
        ),
      };
    // 😃 optimism!
    case ACTIVITY_END:
      return {
        ...state,
        activities: {
          ...state.activities,
          [action.id]: {
            ...state.activities[action.id],
            endTime: action.timestamp,
            status: 'complete',
          },
        },
        /* 💁 we don't terminate block if it was suspended, since there is no block to terminate */
        blocks:
          state.activities[action.id].status === 'suspended'
            ? state.blocks
            : terminateBlock(
                state.blocks,
                action.id,
                action.timestamp,
                action.eventFlavor || 'E',
                action.message,
              ),
        lastThread_id: action.thread_id,
        threadLevels: updateThreadLevels(
          action.thread_id,
          -1,
          state.threadLevels,
        ),
      };
    // 😃 optimism!
    /** ⚠️ TODO make sure the activity is suspendable! */
    case ACTIVITY_SUSPEND:
      /* ⚠️ TODO process the whole trace so child blocks are also suspended */
      return {
        ...state,
        activities: {
          ...state.activities,
          [action.id]: {
            ...state.activities[action.id],
            endTime: action.timestamp,
            status: 'suspended',
            events: [
              ...state.activities[action.id].events,
              'optimisticActivitySuspension',
            ],
          },
        },
        events: [
          ...state.events,
          {
            timestamp: action.timestamp,
            phase: 'S',
            message: action.message,
            id: 'optimisticActivitySuspension',
            activity: {
              ...state.activities[action.id],
              id: action.id, // this is only here because of optimism
            },
          },
        ],
        blocks: terminateBlock(
          state.blocks,
          action.id,
          action.timestamp,
          'S',
          action.message,
          'optimisticActivitySuspension',
        ),
        lastThread_id: action.thread_id,
        threadLevels: {
          ...state.threadLevels,
          [action.thread_id]: {
            current: state.threadLevels[action.thread_id].current - 1,
            max: state.threadLevels[action.thread_id].max,
          },
        },
      };

    case `${ACTIVITY_SUSPEND}_SUCCEEDED`:
      return {
        ...state,
        activities: mapRecord(state.activities, (v: any) =>
            v.events.includes('optimisticActivitySuspension')
              ? {
                  ...v,
                  events: v.events.map((e: EntityId) =>
                    e === 'optimisticActivitySuspension' ? action.data.id : e,
                  ),
                }
              : v,
          ),
        blocks: state.blocks.map((b: any) =>
          b.events.includes('optimisticActivitySuspension')
            ? {
                ...b,
                events: b.events.map((e: EntityId) =>
                  e === 'optimisticActivitySuspension' ? action.data.id : e,
                ),
              }
            : b,
        ),
        events: state.events.map((e: any) =>
          e.id === 'optimisticActivitySuspension'
            ? { ...e, id: action.data.id }
            : e,
        ),
      };
    /** ⚠️ need to handle network failures */
    case ACTIVITY_UPDATE: {
      const activity = state.activities[action.id];
      if (!activity) return state;

      const nextThreadId = action.updates.thread_id;
      const moveChildIds = action.updates.move_child_ids as EntityId[] | undefined;
      let subtreeIds: string[];
      let detachChildIds: string[] = [];

      if (nextThreadId === undefined) {
        subtreeIds = [String(action.id)];
      } else if (moveChildIds !== undefined) {
        const selected = new Set(moveChildIds.map(String));
        const directChildIds = Object.entries(state.activities)
          .filter(([, candidate]) =>
            candidate.parent_id !== null
            && candidate.parent_id !== undefined
            && String(candidate.parent_id) === String(action.id))
          .map(([key]) => key);
        detachChildIds = directChildIds.filter(id => !selected.has(id));
        subtreeIds = [String(action.id)];
        for (const childId of directChildIds) {
          if (!selected.has(childId)) continue;
          subtreeIds.push(...activitySubtreeIds(childId, state.activities));
        }
        subtreeIds = [...new Set(subtreeIds)];
      } else {
        subtreeIds = activitySubtreeIds(action.id, state.activities);
      }

      const subtreeSet = new Set(subtreeIds);
      const detachMovedRoot = nextThreadId !== undefined
        && activity.parent_id !== null
        && activity.parent_id !== undefined
        && !subtreeSet.has(String(activity.parent_id));

      const activities = { ...state.activities };
      for (const key of subtreeIds) {
        const current = activities[key];
        if (!current) continue;
        activities[key] = {
          ...current,
          name: key === String(action.id) && action.updates.name
            ? action.updates.name
            : current.name,
          categories: key === String(action.id) && Array.isArray(action.updates.category_ids)
            ? action.updates.category_ids
            : current.categories,
          startTime: key === String(action.id) && action.updates.startTime
            ? action.updates.startTime
            : current.startTime,
          endTime: key === String(action.id) && action.updates.endTime
            ? action.updates.endTime
            : current.endTime,
          weight: key === String(action.id) && action.updates.weight
            ? action.updates.weight
            : current.weight,
          ...(nextThreadId === undefined ? {} : { thread_id: nextThreadId }),
          ...(detachMovedRoot && key === String(action.id) ? { parent_id: null } : {}),
          ...(key === String(action.id) && Object.prototype.hasOwnProperty.call(action.updates, 'agent_id')
            ? {
                agent_id: action.updates.agent_id ?? null,
                agent_name: action.updates.agent_id
                  ? (action.updates.agent_name ?? current.agent_name)
                  : null,
              }
            : {}),
        };
      }

      const remainingParentId = remainingSameThreadParent(activity, state.activities);

      for (const key of detachChildIds) {
        const current = activities[key];
        if (!current) continue;
        activities[key] = { ...current, parent_id: remainingParentId };
      }

      const events = Object.prototype.hasOwnProperty.call(action.updates, 'agent_id')
        ? state.events.map(event => {
            if (String(event.activity?.id) !== String(action.id)) return event;
            return {
              ...event,
              activity: event.activity
                ? {
                    ...event.activity,
                    agent_id: action.updates.agent_id ?? null,
                    agent_name: action.updates.agent_id
                      ? (action.updates.agent_name ?? event.activity.agent_name)
                      : null,
                  }
                : event.activity,
            };
          })
        : state.events;

      return {
        ...state,
        lastThread_id: action.thread_id,
        activities,
        events,
      };
    }
    case `${ACTIVITY_UPDATE}_SUCCEEDED`: {
      const data = action.data;
      if (!data || data.id === undefined || data.id === null) return state;
      if (!Object.prototype.hasOwnProperty.call(data, 'agent_id')) return state;
      const key = String(data.id);
      const current = state.activities[key];
      if (!current) return state;
      const agentId = data.agent_id ?? null;
      const agentName = agentId ? (data.agent_name ?? current.agent_name) : null;
      return {
        ...state,
        activities: {
          ...state.activities,
          [key]: { ...current, agent_id: agentId, agent_name: agentName },
        },
        events: state.events.map((event: any) => {
          if (String(event.activity?.id) !== key) return event;
          return {
            ...event,
            activity: event.activity
              ? { ...event.activity, agent_id: agentId, agent_name: agentName }
              : event.activity,
          };
        }),
      };
    }
    /** 😃 optimism */
    case CATEGORY_CREATE: {
      if (action.activity_id == null) return state;
      const activity = state.activities[action.activity_id];
      if (!activity) return state;
      return {
        ...state,
        activities: {
          ...state.activities,
          [action.activity_id]: {
            ...activity,
            categories: [
              ...activity.categories,
              'optimisticCategory',
            ],
          },
        },
      };
    }

    case `${CATEGORY_CREATE}_SUCCEEDED`:
      return {
        ...state,
        activities: mapRecord(state.activities, (act: any) =>
          act.categories.includes('optimisticCategory')
            ? {
                ...act,
                categories: act.categories.map((cat: EntityId) =>
                  cat === 'optimisticCategory' ? action.data.id : cat,
                ),
              }
            : act,
        ),
      };

    case THREAD_CREATE:
      return {
        ...state,
        threads: {
          ...state.threads,
          optimisticThread: {
            id: 'optimisticThread',
            name: action.name,
            rank: action.rank,
            collapsed: false,
          },
        },
        threadLevels: {
          ...state.threadLevels,
          optimisticThread: { current: 0, max: 0 },
        },
      };

    case `${THREAD_CREATE}_SUCCEEDED`:
      const optimisticThread = state.threads.optimisticThread;
      const newThread = action.data;

      // Do not leave the timeline with an invalid optimistic entry if the
      // server response is unexpectedly incomplete.
      if (!optimisticThread || !newThread || !newThread.id) return state;

      return {
        ...state,
        threads: {
          ...omitRecord(state.threads, ['optimisticThread']),
          [newThread.id]: {
            ...optimisticThread,
            ...newThread,
          },
        },
        threadLevels: {
          ...omitRecord(state.threadLevels, ['optimisticThread']),
          [newThread.id]: state.threadLevels.optimisticThread,
        },
      };
    /** ⚠️ need to handle failures */
    case THREAD_DELETE:
      const activs: AnyRecord = {};
      Object.entries(state.activities).forEach(([key, val]: [string, any]) => {
        if (val.thread_id !== action.id) {
          activs[key] = val;
        }
      });

      return {
        ...state,
        threads: omitRecord(state.threads, [action.id]),
        activities: activs,
        threadLevels: omitRecord(state.threadLevels, [action.id]),
        trace: state.trace
          ? {
              ...state.trace,
              filterExcludes: (state.trace.filterExcludes ?? [])
                .filter(id => String(id) !== String(action.id)),
            }
          : state.trace,
      };

    case THREAD_COLLAPSE:
      return {
        ...state,
        threads: {
          ...state.threads,
          [action.id]: { ...state.threads[action.id], collapsed: true },
        },
      };

    case THREAD_EXPAND:
      return {
        ...state,
        threads: {
          ...state.threads,
          [action.id]: { ...state.threads[action.id], collapsed: false },
        },
      };
    /** ⚠️ need to handle failures */
    case THREAD_UPDATE:
      return {
        ...state,
        threads: {
          ...state.threads,
          [action.id]: { ...state.threads[action.id], ...action.updates },
        },
      };

    case THREADS_EXPAND_ALL:
      return {
        ...state,
        threads: mapRecord(state.threads, thread => ({ ...thread, collapsed: false })),
      };

    case THREADS_COLLAPSE_ALL:
      return {
        ...state,
        threads: mapRecord(state.threads, thread => ({ ...thread, collapsed: true })),
      };

    case BLOCK_FOCUS:
      return {
        ...state,
        focusedBlockIndex: action.index,
        focusedBlockActivity_id: action.activity_id,
        thread_id: action.thread_id,
      };

    case BLOCK_HOVER:
      return {
        ...state,
        hoveredBlockIndex: action.index,
        hoveredBlockActivity_id: action.activity_id,
      };

    case TIMELINE_SET:
      const { leftBoundaryTime: l, rightBoundaryTime: r } = action;
      return {
        ...state,
        leftBoundaryTime: l,
        rightBoundaryTime: r,
      };

    default:
      return state;
  }
}

export default timeline;
