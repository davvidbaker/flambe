import mapKeys from "lodash/fp/mapKeys";
import mapValues from "lodash/fp/mapValues";
import map from "lodash/fp/map";
import omit from "lodash/fp/omit";

import {
  ACTIVITY_CREATE,
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
  TODO_BEGIN,
  TRACE_SELECT,
  TRACE_FETCH
} from "actions";

import { zoom, pan, processTrace, findById } from "../utilities";
import { terminateBlock } from "../utilities/processTrace";

export const getTimeline = state => state.timeline;

const initialState = {
  trace: {
    id: null,
    name: null
  },
  focusedBlockIndex: null,
  focusedBlockActivity_id: null,
  threads: {},
  threadLevels: {},
  leftBoundaryTime: 0,
  rightBoundaryTime: 0,
  flameChartTopOffset: 0,
  lastThread: null,
  lastCategory_id: null
};

function updateThreadLevels(thread_id, delta, threadLevels) {
  const threadLevel = threadLevels[thread_id];
  return {
    ...threadLevels,
    [thread_id]: {
      current: threadLevel.current + delta,
      max:
        delta > 0
          ? Math.max(threadLevel.current + delta, threadLevel.max)
          : threadLevel.max
    }
  };
}

function createBlock(
  blocks,
  thread_id,
  timestamp,
  threadLevels,
  activity_id = "optimisticActivity",
  beginning = "B"
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
        beginning
      }
    ],
    threadLevels: updateThreadLevels(thread_id, 1, threadLevels)
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
        rightBoundaryTime
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
        flameChartTopOffset: topOffset
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
        events
      } = processTrace(action.events, action.threads);

      console.log("threads", threads);

      return {
        ...state,
        minTime: min,
        maxTime: max,
        activities,
        blocks,
        threadLevels,
        threads,
        lastCategory_id,
        lastThread_id,
        events
      };

    /* ⚠️ this is optimistic, need to handle failure */
    case ATTENTION_SHIFT:
      return {
        ...state,
        threads: {
          ...mapValues(thread => ({ ...thread, rank: thread.rank + 1 }))(state.threads),
          [action.thread_id]: { ...state.threads[action.thread_id], rank: 0 }
        }
      };
      break;

    case TRACE_SELECT:
      return {
        ...state,
        trace: action.trace
      };

    case DELETE_CURRENT_TRACE:
      return {
        ...state,
        trace: null
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
    case ACTIVITY_CREATE:
      return {
        ...state,
        lastThread_id: action.thread_id,
        activities: {
          ...state.activities,
          optimisticActivity: {
            name: action.name,
            flavor: action.phase === "Q" ? "question" : "task",
            startTime: action.timestamp,
            categories: [action.category_id],
            status: "active",
            thread_id: action.thread_id
          }
        },
        ...createBlock(
          state.blocks,
          action.thread_id,
          action.timestamp,
          state.threadLevels
        )
      };

    case `${TODO_BEGIN}_SUCCEEDED`:
    case `${ACTIVITY_CREATE}_SUCCEEDED`:
      return {
        ...state,
        blocks: state.blocks.map(block =>
          (block.activity_id === "optimisticActivity"
            ? { ...block, activity_id: action.data.id }
            : block)),
        activities: mapKeys(key => (key === "optimisticActivity" ? action.data.id : key))(state.activities)
      };

    case ACTIVITY_RESUME:
      return {
        ...state,
        activities: {
          ...state.activities,
          [action.id]: {
            ...state.activities[action.id],
            endTime: action.timestamp,
            status: "active"
          }
        },
        ...createBlock(
          state.blocks,
          action.thread_id,
          action.timestamp,
          state.threadLevels,
          action.id,
          "R"
        )
      };

    case ACTIVITY_RESURRECT:
      return {
        ...state,
        activities: {
          ...state.activities,
          [action.id]: {
            ...state.activities[action.id],
            endTime: action.timestamp,
            status: "active"
          }
        },
        ...createBlock(
          state.blocks,
          action.thread_id,
          action.timestamp,
          state.threadLevels,
          action.id,
          "X"
        )
      };

    case ACTIVITY_DELETE:
      const remainingBlocks = state.blocks.filter(block => block.activity_id !== action.id);
      const activityBlocks = state.blocks.filter(block => block.activity_id === action.id);

      /** 💁 we need to adjust the levels of any affected blocks */
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
        activities: omit([action.id])(state.activities),

        focusedBlockIndex: null,
        focusedBlockActivity_id: null,
        lastThread_id: action.thread_id,
        /** 💁 if the activity hasn't ended, we need to adjust thread level for the future */
        blocks: remainingBlocks,
        threadLevels: updateThreadLevels(
          action.thread_id,
          -1,
          state.threadLevels
        )
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
            status: "complete"
          }
        },
        blocks: terminateBlock(
          state.blocks,
          action.id,
          action.timestamp,
          action.eventFlavor || "E",
          action.message
        ),
        lastThread_id: action.thread_id,
        threadLevels: updateThreadLevels(
          action.thread_id,
          -1,
          state.threadLevels
        )
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
            status: "suspended"
          }
        },
        blocks: terminateBlock(
          state.blocks,
          action.id,
          action.timestamp,
          "S",
          action.message
        ),
        lastThread_id: action.thread_id,
        threadLevels: {
          ...state.threadLevels,
          [action.thread_id]: {
            current: state.threadLevels[action.thread_id].current - 1,
            max: state.threadLevels[action.thread_id].max
          }
        }
      };
    /** ⚠️ need to handle network failures */
    case ACTIVITY_UPDATE:
      const activity = state.activities[action.id];
      console.log("activity", activity);
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
              : activity.endTime
          }
        }
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
              "optimisticCategory"
            ]
          }
        }
      };

    case `${CATEGORY_CREATE}_SUCCEEDED`:
      return {
        ...state,
        activities: mapValues(act =>
          (act.categories.includes("optimisticCategory")
            ? {
              ...act,
              categories: act.categories.map(cat => (cat === "optimisticCategory" ? action.data.id : cat))
            }
            : act))(state.activities)
      };

    case THREAD_CREATE:
      return {
        ...state,
        threads: {
          ...state.threads,
          optimisticThread: {
            name: action.name,
            rank: action.rank,
            collapsed: false
          }
        },
        threadLevels: {
          ...state.threadLevels,
          optimisticThread: { current: 0, max: 0 }
        }
      };

    case `${THREAD_CREATE}_SUCCEEDED`:
      return {
        ...state,
        threads: mapKeys((value, key) => (key === "optimisticThread" ? action.data.id : key))(state.threads),
        threadLevels: mapKeys((_val, key) => (key === "optimisticThread" ? action.data.id : key))(state.threadLevels)
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
        threads: omit([action.id])(state.threads),
        activities: activs,
        threadLevels: omit([action.id])(state.threadLevels)
      };

    case THREAD_COLLAPSE:
      return {
        ...state,
        threads: {
          ...state.threads,
          [action.id]: { ...state.threads[action.id], collapsed: true }
        }
      };

    case THREAD_EXPAND:
      return {
        ...state,
        threads: {
          ...state.threads,
          [action.id]: { ...state.threads[action.id], collapsed: false }
        }
      };
    /** ⚠️ need to handle failures */
    case THREAD_UPDATE:
      return {
        ...state,
        threads: {
          ...state.threads,
          [action.id]: { ...state.threads[action.id], ...action.updates }
        }
      };

    case THREADS_EXPAND_ALL:
      return {
        ...state,
        threads: mapValues(thread => ({ ...thread, collapsed: false }))(state.threads)
      };

    case THREADS_COLLAPSE_ALL:
      return {
        ...state,
        threads: mapValues(thread => ({ ...thread, collapsed: true }))(state.threads)
      };

    case BLOCK_FOCUS:
      return {
        ...state,
        focusedBlockIndex: action.index,
        focusedBlockActivity_id: action.activity_id,
        thread_id: action.thread_id
      };

    case BLOCK_HOVER:
      return {
        ...state,
        hoveredBlockIndex: action.index,
        hoveredBlockActivity_id: action.activity_id
      };

    default:
      return state;
  }
}

export default timeline;
