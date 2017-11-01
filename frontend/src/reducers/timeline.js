import mapKeys from 'lodash/mapKeys';
import mapValues from 'lodash/mapValues';

import {
  ACTIVITY_CREATE,
  ACTIVITY_DELETE,
  ACTIVITY_END,
  ACTIVITY_UPDATE,
  CATEGORY_CREATE,
  PROCESS_TIMELINE_TRACE,
  FOCUS_ACTIVITY,
  HOVER_ACTIVITY,
  UPDATE_THREAD_LEVEL,
  DELETE_CURRENT_TRACE,
  TRACE_SELECT,
  TRACE_FETCH,
  TIMELINE_ZOOM,
  TIMELINE_PAN,
} from 'actions';

import { zoom, pan, processTrace } from 'utilities';

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
};

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
        min,
        max,
        threadLevels,
        threads,
        lastCategory,
      } = processTrace(action.events, action.threads);

      return {
        ...state,
        focusedActivityId: null,
        minTime: min,
        maxTime: max,
        activities,
        threadLevels,
        threads,
        lastCategory,
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
      return {
        ...state,
        threadLevels: {
          ...state.threadLevels,
          [action.id]: state.threadLevels[action.id] + action.inc,
        },
      };
    // 😃 optimism!
    case ACTIVITY_CREATE:
      return {
        ...state,
        activities: {
          ...state.activities,
          optimisticActivity: {
            name: action.name,
            startTime: action.timestamp,
            categories: [action.category_id],
            level: state.threadLevels[action.thread_id],
            thread: { id: action.thread_id },
          },
        },
        threadLevels: {
          ...state.threadLevels,
          [action.thread_id]: state.threadLevels[action.thread_id] + 1,
        },
      };

    case `${ACTIVITY_CREATE}_SUCCEEDED`:
      return {
        ...state,
        activities: mapKeys(
          state.activities,
          (_val, key) => (key === 'optimisticActivity' ? action.data.id : key),
        ),
      };

    case ACTIVITY_DELETE:
      const acts = {};
      /** 💁 we need to adjust the levels of any affected activities */
      Object.entries(state.activities).forEach(([key, val]) => {
        if (key !== action.id) {
          acts[key] = val;
          if (val.thread.id === action.thread_id) {
            if (!state.activities[action.id].endTime) {
              if (val.startTime > state.activities[action.id].startTime) {
                acts[key].level--;
              }
            } else if (val.startTime > state.activities[action.id].startTime && val.endTime < state.activities[action.id].endTime) {
              acts[key].level--;
            }
          }
        }
      })

      return {
        ...state,
        activities: acts,
        focusedActivityId: null,
        /** 💁 if the activity hasn't ended, we need to adjust thread level for the future */
        threadLevels: state.activities[action.id].endTime ? state.threadLevels : {
          ...state.threadLevels,
          [action.thread_id]: state.threadLevels[action.thread_id] - 1,
        }
      };

    // 😃 optimism!
    case ACTIVITY_END:
      console.log(state);
      return {
        ...state,
        activities: {
          ...state.activities,
          [action.id]: {
            ...state.activities[action.id],
            endTime: action.timestamp,
          },
        },
        threadLevels: {
          ...state.threadLevels,
          [action.thread_id]: state.threadLevels[action.thread_id] - 1,
        },
      };
    /** ⚠️ need to handle network failures */
    case ACTIVITY_UPDATE:
      return {
        ...state,
        activities: {
          ...state.activities,
          /** ⚠️ right now you can only change activity name, not description */
          [action.id]: { ...state.activities[action.id], name: action.name },
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
                  cat =>
                    (cat === 'optimisticCategory' ? action.data.id : cat),
                ),
              }
              : act),
        ),
      };

    case FOCUS_ACTIVITY:
      return {
        ...state,
        focusedActivityId: action.id,
      };

    case HOVER_ACTIVITY:
      return {
        ...state,
        hoveredActivityId: action.id,
      };

    default:
      return state;
  }
}

export default timeline;
