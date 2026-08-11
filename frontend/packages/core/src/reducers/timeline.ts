import {
  map,
  uniq,
  omit,
  mapKeys,
  mapValues,
  remove,
  filter,
  omitBy,
  difference,
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
  ATTENTION_SHIFT,
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
  THREAD_UPDATE,
  THREADS_COLLAPSE_ALL,
  THREADS_EXPAND_ALL,
  TIMELINE_ZOOM,
  TIMELINE_PAN,
  TIMELINE_SET,
  TODO_BEGIN,
  TRACE_SELECT,
  TRACE_FETCH,
  TRACE_FILTER,
} from '../actions';
import zoom from '../utilities/zoom';
import pan from '../utilities/pan';
import processTrace from '../utilities/processTrace';
import { getFilteredThreads } from '../utilities/timeline';
import { terminateBlock, type ProcessedActivity, type ThreadLevel, type TraceBlock } from '../utilities/processTrace';
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

export const getTimeline = (state: any): any => state.timeline;
export const getFilterExcludes = (state: any): EntityId[] => state.timeline.trace?.filterExcludes ?? [];

export const getTimelineWithFiltersApplied = (state: any): any => {
  const filterExcludes = getFilterExcludes(state) || [];
  const timeline = getTimeline(state);

  const activities = Object.fromEntries(Object.entries(timeline.activities).filter(([, activity]: [string, any]) => !filterExcludes.includes(activity.thread_id)));

  return {
    ...timeline,
    activities,
    blocks: timeline.blocks.filter((b: any) =>
      Object.keys(activities)
        .map(k => Number(k))
        .includes(b.activity_id),
    ),
    threads: getFilteredThreads(filterExcludes, timeline.threads),
    lastThread_id: filterExcludes.includes(state.lastThread_id)
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
      console.log(`action.threads`, action.threads);
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
      } = processTrace(action.events, action.threads);

      console.log('threads', threads);

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

    /* ⚠️ this is optimistic, need to handle failure */
    case ATTENTION_SHIFT:
      return {
        ...state,
        threads: {
          ...mapRecord(state.threads, thread => ({ ...thread, rank: thread.rank + 1 })),
          [action.thread_id]: { ...state.threads[action.thread_id], rank: 0 },
        },
      };

    case TRACE_SELECT:
      return {
        ...state,
        trace: { id: action.trace.id ?? null, name: action.trace.name ?? null, filterExcludes: action.trace.filterExcludes ?? [] },
      };

    case TRACE_FILTER:
      const allThread_ids = Object.keys(state.threads).map(key => Number(key));
      return {
        ...state,
        trace: {
          id: state.trace?.id ?? null,
          name: state.trace?.name ?? null,
          filterExcludes: difference(
            allThread_ids,
            action.selectedThreads.map(({ value }: { value: EntityId }) => Number(value)),
          ),
        },
      };

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
    case TODO_BEGIN:

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

    case `${TODO_BEGIN}_SUCCEEDED`:
    case `${ACTIVITY_CREATE_B}_SUCCEEDED`:
    case `${ACTIVITY_CREATE_Q}_SUCCEEDED`:
      console.log(`action.data`, action.data);
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
    case ACTIVITY_UPDATE:
      const activity = state.activities[action.id];
      return {
        ...state,
        lastThread_id: action.thread_id,
        activities: {
          ...state.activities,
          /* ⚠️ ugly */
          [action.id]: {
            ...state.activities[action.id],
            name: action.updates.name ? action.updates.name : activity.name,
            categories: action.updates.category_ids
              ? action.updates.category_ids.length > 0
                ? [...activity.categories, ...action.updates.category_ids]
                : activity.categories
              : activity.categories,
            startTime: action.updates.startTime
              ? action.updates.startTime
              : activity.startTime,
            endTime: action.updates.endTime
              ? action.updates.endTime
              : activity.endTime,
            weight: action.updates.weight
              ? action.updates.weight
              : activity.weight,
          },
        },
      };
    /** 😃 optimism */
    case CATEGORY_CREATE:
      return {
        ...state,
        activities: {
          ...state.activities,
          [action.activity_id]: {
            ...state.activities[action.activity_id],
            categories: [
              ...state.activities[action.activity_id].categories,
              'optimisticCategory',
            ],
          },
        },
      };

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
