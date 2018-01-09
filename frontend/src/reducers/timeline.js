import mapKeys from 'lodash/mapKeys';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';

import {
  ACTIVITY_CREATE,
  ACTIVITY_DELETE,
  ACTIVITY_END,
  ACTIVITY_RESUME,
  ACTIVITY_SUSPEND,
  ACTIVITY_UPDATE,
  BLOCK_FOCUS,
  BLOCK_HOVER,
  CATEGORY_CREATE,
  PROCESS_TIMELINE_TRACE,
  UPDATE_THREAD_LEVEL,
  DELETE_CURRENT_TRACE,
  THREAD_CREATE,
  THREAD_DELETE,
  THREAD_COLLAPSE,
  THREAD_EXPAND,
  THREAD_UPDATE,
  TIMELINE_ZOOM,
  TIMELINE_PAN,
  TODO_BEGIN,
  TRACE_SELECT,
  TRACE_FETCH,
} from 'actions';

import { zoom, pan, processTrace } from 'utilities';
import { terminateBlock } from 'utilities/processTrace';

export const getTimeline = state => state.timeline;

const initialState = {
  trace: {
    id: null,
    name: null,
  },
  threadLevels: {},
  leftBoundaryTime: 0,
  rightBoundaryTime: 0,
  flameChartTopOffset: 0,
  lastThread: null,
  lastCategory_id: null,
};

function createBlock(blocks, thread_id, timestamp, threadLevels) {
  return {
    blocks: [
      ...blocks,
      {
        level: threadLevels[thread_id].current,
        startTime: timestamp,
        activity_id: 'optimisticActivity',
      },
    ],
    threadLevels: {
      ...threadLevels,
      [thread_id]: {
        current: threadLevels[thread_id].current + 1,
        max: Math.max(
          threadLevels[thread_id].current + 1,
          threadLevels[thread_id].max
        ),
      },
    },
  };
}

function timeline(state = initialState, action) {
  switch (action.type) {
    case TIMELINE_ZOOM:
      const { leftBoundaryTime, rightBoundaryTime } = zoom(
        action.deltaY,
        action.zoomCenter,
        action.zoomCenterTime,
        action.leftBoundaryTime,
        action.rightBoundaryTime,
        action.width,
        action.nowTime,
        action.minTime
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
        action.minTime
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
      } = processTrace(action.events, action.threads);

      return {
        ...state,
        focusedBlockIndex: null,
        minTime: min,
        maxTime: max,
        activities,
        blocks,
        threadLevels,
        threads,
        lastCategory_id,
        lastThread_id,
      };

    case TRACE_SELECT:
      return {
        ...state,
        trace: action.trace,
      };

    case DELETE_CURRENT_TRACE:
      return {
        ...state,
        trace: null,
      };

    case UPDATE_THREAD_LEVEL:
      const prevLevel = state.threadLevels[action.id].current;
      const prevMax = state.threadLevels[action.id].max;
      return {
        ...state,
        threadLevels: {
          ...state.threadLevels,
          [action.id]: {
            current: prevLevel + action.inc,
            max: Math.max(prevLevel + action.inc, prevMax),
          },
        },
      };
    // 😃 optimism!
    case TODO_BEGIN:
    case ACTIVITY_CREATE:
      return {
        ...state,
        lastThread_id: action.thread_id,
        activities: {
          ...state.activities,
          optimisticActivity: {
            name: action.name,
            flavor: action.phase === 'Q' ? 'question' : 'task',
            startTime: action.timestamp,
            categories: [action.category_id],
            status: 'active',
            thread: {
              id: action.thread_id,
            },
          },
        },
        ...createBlock(
          state.blocks,
          action.thread_id,
          action.timestamp,
          state.threadLevels
        ),
      };

    case `${TODO_BEGIN}_SUCCEEDED`:
    case `${ACTIVITY_CREATE}_SUCCEEDED`:
      return {
        ...state,
        blocks: state.blocks.map(
          block =>
            (block.activity_id === 'optimisticActivity'
              ? { ...block, activity_id: action.data.id }
              : block)
        ),
        activities: mapKeys(
          state.activities,
          (_val, key) => (key === 'optimisticActivity' ? action.data.id : key)
        ),
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
          state.threadLevels
        ),
      };

    case ACTIVITY_DELETE:
      const acts = {};
      const remainingBlocks = state.blocks.filter(
        block => block.activity_id !== action.id
      );
      const activityBlocks = state.blocks.filter(
        block => block.activity_id === action.id
      );
      /** 💁 we need to adjust the levels of any affected blocks */
      Object.entries(state.activities).forEach(([key, val]) => {
        if (key !== action.id) {
          acts[key] = val;
        }
      });

      for (let i = 0; i < remainingBlocks.length; i++) {
        if (
          state.activities[remainingBlocks[i].activity_id].thread.id ===
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
              activityBlocks[j].endTime > remainingBlocks[i].endTime
            ) {
              remainingBlocks[i].level--;
            }
          }
        }
      }

      return {
        ...state,
        activities: acts,
        focusedBlockIndex: null,
        focusedBlockActivity_id: null,
        lastThread_id: action.thread_id,
        /** 💁 if the activity hasn't ended, we need to adjust thread level for the future */
        blocks: remainingBlocks,
        threadLevels: state.activities[action.id].endTime
          ? state.threadLevels
          : {
            ...state.threadLevels,
            /** ⚠️ I THINK THIS IS WRONG */
            [action.thread_id]: {
              current: state.threadLevels[action.thread_id].current - 1,
              max: state.threadLevels[action.thread_id].max,
            },
          },
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
        blocks: terminateBlock(
          state.blocks,
          action.id,
          action.timestamp,
          action.eventFlavor || 'E',
          action.message
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
    // 😃 optimism!
    /** ⚠️ TODO make sure the activity is suspendable! */
    case ACTIVITY_SUSPEND:
      return {
        ...state,
        activities: {
          ...state.activities,
          [action.id]: {
            ...state.activities[action.id],
            endTime: action.timestamp,
            status: 'suspended',
          },
        },
        blocks: terminateBlock(
          state.blocks,
          action.id,
          action.timestamp,
          'S',
          action.message
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
    /** ⚠️ need to handle network failures */
    case ACTIVITY_UPDATE:
      return {
        ...state,
        lastThread_id: action.thread_id,
        activities: {
          ...state.activities,
          /** ⚠️ right now you can only change activity name, not description */
          [action.id]: {
            ...state.activities[action.id],
            name: action.updates.name
              ? action.updates.name
              : state.activities[action.id].name,
            categories: action.updates.category_ids
              ? action.updates.category_ids.length > 0
                ? [
                  ...state.activities[action.id].categories,
                  ...action.updates.category_ids,
                ]
                : state.activities[action.id].categories
              : state.activities[action.id].categories,
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
        activities: mapValues(
          state.activities,
          act =>
            (act.categories.includes('optimisticCategory')
              ? {
                ...act,
                categories: act.categories.map(
                  cat => (cat === 'optimisticCategory' ? action.data.id : cat)
                ),
              }
              : act)
        ),
      };

    case THREAD_CREATE:
      return {
        ...state,
        threads: [
          ...state.threads,
          {
            name: action.name,
            rank: action.rank,
            id: 'optimisticThread',
            collapsed: false,
          },
        ],
        threadLevels: {
          ...state.threadLevels,
          optimisticThread: { current: 0, max: 0 },
        },
      };

    case `${THREAD_CREATE}_SUCCEEDED`:
      return {
        ...state,
        threads: state.threads.map(
          thread =>
            (thread.id === 'optimisticThread'
              ? { ...thread, id: action.data.id }
              : thread)
        ),
        threadLevels: mapKeys(
          state.threadLevels,
          (_val, key) => (key === 'optimisticThread' ? action.data.id : key)
        ),
      };
    /** ⚠️ need to handle failures */
    case THREAD_DELETE:
      const activs = {};
      Object.entries(state.activities).forEach(([key, val]) => {
        if (val.thread.id !== action.id) {
          activs[key] = val;
        }
      });

      return {
        ...state,
        threads: state.threads.filter(thread => thread.id !== action.id),
        activities: activs,
        threadLevels: omit(state.threadLevels, action.id),
      };

    case THREAD_COLLAPSE:
      return {
        ...state,
        threads: state.threads.map(
          thread =>
            (thread.id === action.id ? { ...thread, collapsed: true } : thread)
        ),
      };

    case THREAD_EXPAND:
      return {
        ...state,
        threads: state.threads.map(
          thread =>
            (thread.id === action.id ? { ...thread, collapsed: false } : thread)
        ),
      };
    /** ⚠️ need to handle failures */
    case THREAD_UPDATE:
      return {
        ...state,
        threads: state.threads.map(
          thread =>
            (thread.id === action.id
              ? { ...thread, ...action.updates }
              : thread)
        ),
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

    default:
      return state;
  }
}

export default timeline;
