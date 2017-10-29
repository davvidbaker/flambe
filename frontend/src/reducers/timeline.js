import mapKeys from 'lodash/mapKeys';
import mapValues from 'lodash/mapValues';

import {
  PROCESS_TIMELINE_TRACE,
  FOCUS_ACTIVITY,
  HOVER_ACTIVITY,
  UPDATE_ACTIVITY,
  UPDATE_THREAD_LEVEL,
  ZOOM_TIMELINE,
  PAN_TIMELINE,
  DELETE_CURRENT_TRACE,
  TRACE_SELECT,
  TRACE_FETCH,
  ACTIVITY_CREATE,
  ACTIVITY_END,
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
    case ZOOM_TIMELINE:
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

    case PAN_TIMELINE:
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
          (_val, key) => (key === 'optimisticActivity' ? action.data.id : key)
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
          },
        },
        threadLevels: {
          ...state.threadLevels,
          [action.thread_id]: state.threadLevels[action.thread_id] - 1,
        },
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

    case UPDATE_ACTIVITY:
      return {
        ...state,
        activities: {
          ...state.activities,
          [action.id]: { ...state.activities[action.id], ...action.updates },
        },
      };

    default:
      return state;
  }
}

export default timeline;
