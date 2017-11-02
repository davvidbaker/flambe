// @flow
import type { Trace } from 'types/Trace';

export const PROCESS_TIMELINE_TRACE = 'PROCESS_TIMELINE_TRACE';
export const REFLECT_PROCESSED_TRACE = 'REFLECT_PROCESSED_TRACE';
export const ADD_EVENT = 'ADD_EVENT';
export const TIMELINE_ZOOM = 'TIMELINE_ZOOM';
export const TIMELINE_PAN = 'TIMELINE_PAN';
export const FOCUS_ACTIVITY = 'FOCUS_ACTIVITY';
export const HOVER_ACTIVITY = 'HOVER_ACTIVITY';
export const UPDATE_ACTIVITY = 'UPDATE_ACTIVITY';
export const UPDATE_THREAD_LEVEL = 'UPDATE_THREAD_LEVEL';
export const DELETE_CURRENT_TRACE = 'DELETE_CURRENT_TRACE';
export const KEY_DOWN = 'KEY_DOWN';
export const KEY_UP = 'KEY_UP';
export const FETCH_RESOURCE = 'FETCH_RESOURCE';

export const ACTIVITY_CREATE = 'ACTIVITY_CREATE';
export const ACTIVITY_DELETE = 'ACTIVITY_DELETE';
export const ACTIVITY_END = 'ACTIVITY_END';
export const ACTIVITY_UPDATE = 'ACTIVITY_UPDATE';

export const TRACE_CREATE = 'TRACE_CREATE';
export const TRACE_DELETE = 'TRACE_DELETE';
export const TRACE_SELECT = 'TRACE_SELECT';
export const TRACE_FETCH = 'TRACE_FETCH';

export const CATEGORY_CREATE = 'CATEGORY_CREATE';
export const CATEGORY_UPDATE = 'CATEGORY_UPDATE';

export const USER_FETCH = 'USER_FETCH';

// trace array of events -> object of activities
export function processTimelineTrace(events, threads) {
  return {
    type: PROCESS_TIMELINE_TRACE,
    events,
    threads,
  };
}

export function createCategory({
  activity_id,
  name,
  color,
}: {
  activity_id: string,
  name: string,
  color: string,
}) {
  return {
    type: CATEGORY_CREATE,
    activity_id,
    name,
    color,
  };
}

export function updateCategory(id, updates) {
  return {
    type: CATEGORY_UPDATE,
    id,
    updates,
  };
}

export function fetchUser(id) {
  return {
    type: USER_FETCH,
    id,
  };
}

export function createTrace(name: string) {
  return {
    type: TRACE_CREATE,
    name,
  };
}

export function deleteTrace(id: number) {
  return {
    type: TRACE_DELETE,
    id,
  };
}

export function createActivity({
  name,
  timestamp,
  description,
  thread_id /* message */,
  category_id,
}: {
  name: string,
  timestamp: number,
  description: string,
  thread_id: number /* message */,
  category_id: ?number,
}) {
  return {
    type: ACTIVITY_CREATE,
    name,
    timestamp,
    description,
    thread_id,
    category_id,
  };
}

/** 💁 the thread_id is just being used here for optimystical updating threadLevels */
export function endActivity(id, timestamp, message, thread_id) {
  return {
    type: ACTIVITY_END,
    id,
    timestamp,
    message,
    thread_id,
  };
}

/** 💁 the thread_id is just being used here for optimystical updating threadLevels */
export function deleteActivity(id, thread_id) {
  return {
    type: ACTIVITY_DELETE,
    id,
    thread_id,
  };
}

export function updateActivity(id, { name }) {
  return {
    type: ACTIVITY_UPDATE,
    id,
    name,
  };
}

export function focusActivity(id: string) {
  return {
    type: FOCUS_ACTIVITY,
    id,
  };
}

export function hoverActivity(id: string) {
  return {
    type: HOVER_ACTIVITY,
    id,
  };
}

// export function updateActivity(id, updates: {}) {
//   return {
//     type: UPDATE_ACTIVITY,
//     id,
//     updates,
//   };
// }

export function updateThreadLevel(id, inc) {
  return {
    type: UPDATE_THREAD_LEVEL,
    id,
    inc,
  };
}

export function keyDown(key: string) {
  return {
    type: KEY_DOWN,
    key,
  };
}

export function keyUp(key: string) {
  return {
    type: KEY_UP,
    key,
  };
}

export function selectTrace(trace: Trace) {
  return {
    type: TRACE_SELECT,
    trace,
  };
}

export function fetchTrace(trace: Trace) {
  return {
    type: TRACE_FETCH,
    trace,
  };
}

export function deleteCurrentTrace() {
  return {
    type: DELETE_CURRENT_TRACE,
  };
}

export function fetchResource(
  resource: ?{ type: string, id: string },
  params: ?{} = { method: 'GET' },
) {
  return {
    type: FETCH_RESOURCE,
    params,
    resource,
  };
}

/**
 * 
 * 
 * @export
 * @param {number} deltaY - scroll amount in pixels
 * @param {number} zoomCenter - pixels
 * @param {number} zoomCenterTime - UTC
 * @param {number} leftBoundaryTime - UTC
 * @param {number} rightBoundaryTime - UTC
 * @param {number} width - in pixels of element being zoomed
 * @param {number} nowTime - current Time - UTC
 * @param {number} minTime - min time on timeline - UTC
 * @returns 
 */
export function zoomTimeline(
  deltaY: number,
  zoomCenter: number,
  zoomCenterTime: number,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  width: number,
  nowTime: number,
  minTime: number,
) {
  return {
    type: TIMELINE_ZOOM,
    deltaY,
    zoomCenter,
    zoomCenterTime,
    leftBoundaryTime,
    rightBoundaryTime,
    width,
    nowTime,
    minTime,
  };
}

export function panTimeline(
  deltaX: number,
  deltaY: number,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  width: number,
  topOffset: number,
  nowTime: number,
  minTime: number,
) {
  return {
    type: TIMELINE_PAN,
    deltaX,
    deltaY,
    leftBoundaryTime,
    rightBoundaryTime,
    width,
    topOffset,
    nowTime,
    minTime,
  };
}
