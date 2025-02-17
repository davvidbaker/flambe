// @flow
import type { Trace } from 'types/Trace';

export const PROCESS_TIMELINE_TRACE = 'PROCESS_TIMELINE_TRACE';
export const REFLECT_PROCESSED_TRACE = 'REFLECT_PROCESSED_TRACE';
export const ADD_EVENT = 'ADD_EVENT';
export const TIMELINE_ZOOM = 'TIMELINE_ZOOM';
export const TIMELINE_PAN = 'TIMELINE_PAN';
export const TIMELINE_SET = 'TIMELINE_SET';
export const UPDATE_ACTIVITY = 'UPDATE_ACTIVITY';
// export const UPDATE_THREAD_LEVEL = 'UPDATE_THREAD_LEVEL';
export const DELETE_CURRENT_TRACE = 'DELETE_CURRENT_TRACE';
export const KEY_DOWN = 'KEY_DOWN';
export const KEY_UP = 'KEY_UP';
export const FETCH_RESOURCE = 'FETCH_RESOURCE';

export const ACTIVITY_CREATE_B = 'ACTIVITY_CREATE_B';
export const ACTIVITY_CREATE_Q = 'ACTIVITY_CREATE_Q';
export const ACTIVITY_DELETE = 'ACTIVITY_DELETE';
export const ACTIVITY_END = 'ACTIVITY_END'; // 👈 legacy
export const ACTIVITY_REJECT = 'ACTIVITY_REJECT';
export const ACTIVITY_RESOLVE = 'ACTIVITY_RESOLVE';
export const ACTIVITY_RESUME = 'ACTIVITY_RESUME';
export const ACTIVITY_RESURRECT = 'ACTIVITY_RESURRECT';
export const ACTIVITY_SUSPEND = 'ACTIVITY_SUSPEND';
export const ACTIVITY_UPDATE = 'ACTIVITY_UPDATE';

export const ACTIVITY_DETAILS_SHOW = 'ACTIVITY_DETAILS_SHOW';
export const ACTIVITY_DETAILS_HIDE = 'ACTIVITY_DETAILS_HIDE';

export const ATTENTION_SHIFT = 'ATTENTION_SHIFT';

export const BLOCK_FOCUS = 'BLOCK_FOCUS';
export const BLOCK_HOVER = 'BLOCK_HOVER';

export const CATEGORY_CREATE = 'CATEGORY_CREATE';
export const CATEGORY_UPDATE = 'CATEGORY_UPDATE';

export const CATEGORY_MANAGER_SHOW = 'CATEGORY_MANAGER_SHOW';
export const CATEGORY_MANAGER_HIDE = 'CATEGORY_MANAGER_HIDE';

export const COMMAND_RUN = 'COMMAND_RUN';

export const EVENT_UPDATE = 'EVENT_UPDATE';

export const LOG_IN = 'LOG_IN';
export const LOG_OUT = 'LOG_OUT';

export const MANTRA_CREATE = 'MANTRA_CREATE';

export const SEARCH = 'SEARCH';
export const SEARCH_RESULT = 'SEARCH_RESULT';
export const SEARCH_MATCH_INCREMENT = 'SEARCH_MATCH_INCREMENT';
export const SEARCH_BLOCK_INCREMENT = 'SEARCH_BLOCK_INCREMENT';
export const SEARCH_MATCH_INCREMENT_RESULT = 'SEARCH_MATCH_INCREMENT_RESULT';
export const SEARCH_BLOCK_INCREMENT_RESULT = 'SEARCH_BLOCK_INCREMENT_RESULT';

export const ADVANCED_SEARCH_SHOW = 'ADVANCED_SEARCH_SHOW';
export const ADVANCED_SEARCH_HIDE = 'ADVANCED_SEARCH_HIDE';

export const SETTING_TOGGLE = 'SETTING_TOGGLE';

export const SETTINGS_SHOW = 'SETTINGS_SHOW';
export const SETTINGS_HIDE = 'SETTINGS_HIDE';

export const THREAD_CREATE = 'THREAD_CREATE';
export const THREAD_DELETE = 'THREAD_DELETE';
export const THREAD_COLLAPSE = 'THREAD_COLLAPSE';
export const THREAD_EXPAND = 'THREAD_EXPAND';
export const THREAD_UPDATE = 'THREAD_UPDATE';

export const THREADS_COLLAPSE_ALL = 'THREADS_COLLAPSE_ALL';
export const THREADS_EXPAND_ALL = 'THREADS_EXPAND_ALL';

export const TODO_BEGIN = 'TODO_BEGIN';
export const TODO_CREATE = 'TODO_CREATE';
export const TODOS_TOGGLE = 'TODOS_TOGGLE';

export const TOAST_CREATE = 'TOAST_CREATE';
export const TOAST_POP = 'TOAST_POP';

export const TRACE_CREATE = 'TRACE_CREATE';
export const TRACE_DELETE = 'TRACE_DELETE';
export const TRACE_SELECT = 'TRACE_SELECT';
export const TRACE_FETCH = 'TRACE_FETCH';
export const TRACE_FILTER = 'TRACE_FILTER';

export const USER_FETCH = 'USER_FETCH';

export const VIEW_CHANGE = 'VIEW_CHANGE';

export const SEARCH_TERMS_EVENT = 'SEARCH_TERMS_EVENT';
export const TABS_EVENT = 'TABS_EVENT';

export const SET_THREAD_INCLUDE_LIST = 'SET_THREAD_INCLUDE_LIST';
export const SET_THREAD_EXCLUDE_LIST = 'SET_THREAD_EXCLUDE_LIST';

export function toggleTodos(bool) {
  return {
    type: TODOS_TOGGLE,
    bool,
  };
}

export function incrementBlock(direction) {
  return {
    type: SEARCH_BLOCK_INCREMENT,
    direction,
  };
}

export function incrementMatch(direction) {
  return {
    type: SEARCH_MATCH_INCREMENT,
    direction,
  };
}

// trace array of events -> object of activities
export function processTimelineTrace(events, threads) {
  return {
    type: PROCESS_TIMELINE_TRACE,
    events,
    threads,
  };
}

export function runCommand(operand, command) {
  console.log(`🔥  operand, command`, operand, command);
  return {
    type: COMMAND_RUN,
    operand,
    command,
  };
}

export function createThread(name, rank) {
  return {
    type: THREAD_CREATE,
    name,
    rank,
  };
}

export function collapseThread(id) {
  return {
    type: THREAD_COLLAPSE,
    id,
  };
}

export function expandThread(id) {
  return {
    type: THREAD_EXPAND,
    id,
  };
}

export function collapseAllThreads() {
  return {
    type: THREADS_COLLAPSE_ALL,
  };
}

export function expandAllThreads() {
  return {
    type: THREADS_EXPAND_ALL,
  };
}

export function createTodo(name, description) {
  return {
    type: TODO_CREATE,
    name,
    description,
  };
}

export function beginTodo({
  todo_id,
  thread_id,
  name,
  description,
  timestamp,
}) {
  return {
    type: TODO_BEGIN,
    todo_id,
    name,
    description,
    timestamp,
    thread_id,
  };
}

export function createCategory({
  activity_id,
  name,
  color_background,
}: {
  activity_id: string,
  name: string,
  color_background: string,
}) {
  return {
    type: CATEGORY_CREATE,
    activity_id,
    name,
    color_background,
  };
}

export function updateCategory(id, updates) {
  return {
    type: CATEGORY_UPDATE,
    id,
    updates,
  };
}

export function createMantra(name) {
  return {
    type: MANTRA_CREATE,
    name,
  };
}

export function updateThread(id, updates) {
  return {
    type: THREAD_UPDATE,
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

export function deleteThread(id: number) {
  return {
    type: THREAD_DELETE,
    id,
  };
}

export function createActivityB({
  name,
  timestamp,
  description,
  thread_id /* message */,
  category_id,
  phase,
}: {
  name: string,
  timestamp: number,
  description: string,
  thread_id: number /* message */,
  category_id: ?number,
  phase: string,
}) {
  return {
    type: ACTIVITY_CREATE_B,
    name,
    timestamp,
    description,
    thread_id,
    category_id,
    phase,
  };
}

export function createActivityQ({
  name,
  timestamp,
  description,
  thread_id /* message */,
  category_id,
  phase,
}: {
  name: string,
  timestamp: number,
  description: string,
  thread_id: number /* message */,
  category_id: ?number,
  phase: string,
}) {
  return {
    type: ACTIVITY_CREATE_B,
    name,
    timestamp,
    description,
    thread_id,
    category_id,
    phase,
  };
}

/** 💁 the thread_id is just being used here for optimystical updating threadLevels */
export function endActivity({
  id,
  timestamp,
  message,
  thread_id,
  eventFlavor = 'E',
}) {
  return {
    type: ACTIVITY_END,
    id,
    timestamp,
    message,
    thread_id,
    eventFlavor,
  };
}

/** 💁 the thread_id is just being used here for optimystical updating threadLevels */
export function suspendActivity({ id, timestamp, message, thread_id, weight }) {
  return {
    type: ACTIVITY_SUSPEND,
    id,
    timestamp,
    message,
    thread_id,
    weight,
  };
}

/** 💁 the thread_id is just being used here for optimystical updating threadLevels */
export function resumeActivity({ id, timestamp, message, thread_id }) {
  return {
    type: ACTIVITY_RESUME,
    id,
    timestamp,
    message,
    thread_id,
  };
}

/** 💁 the thread_id is just being used here for optimystical updating threadLevels */
export function resurrectActivity({ id, timestamp, message, thread_id }) {
  return {
    type: ACTIVITY_RESURRECT,
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

/** 💁 the thread_id is just being used here for lastThread_id */
export function updateActivity(id, updates) {
  return {
    type: ACTIVITY_UPDATE,
    id,
    updates,
  };
}

export function updateEvent(id, updates) {
  return {
    type: EVENT_UPDATE,
    id,
    updates,
  };
}

export function showActivityDetails() {
  return {
    type: ACTIVITY_DETAILS_SHOW,
  };
}

export function hideActivityDetailModal() {
  return {
    type: ACTIVITY_DETAILS_HIDE,
  };
}

export function showCategoryManager() {
  return {
    type: CATEGORY_MANAGER_SHOW,
  };
}

export function hideCategoryManager() {
  return {
    type: CATEGORY_MANAGER_HIDE,
  };
}

export function showSettings() {
  return {
    type: SETTINGS_SHOW,
  };
}

export function hideSettings() {
  return {
    type: SETTINGS_HIDE,
  };
}

/** 💁 the thread_id is just being used here for optimistic updates when a command is run that operated on the activity */
export function focusBlock({ index, activity_id, activityStatus, thread_id }) {
  return {
    type: BLOCK_FOCUS,
    index,
    activity_id,
    activityStatus,
    thread_id,
  };
}

export function hoverBlock(index: number) {
  return {
    type: BLOCK_HOVER,
    index,
  };
}

// export function updateActivity(id, updates: {}) {
//   return {
//     type: UPDATE_ACTIVITY,
//     id,
//     updates,
//   };
// }

// export function updateThreadLevel(id, inc) {
//   return {
//     type: UPDATE_THREAD_LEVEL,
//     id,
//     inc
//   };
// }

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

export function changeView(view: string, thread_id?: number) {
  return {
    type: VIEW_CHANGE,
    view,
    thread_id,
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

export function toggleSetting(setting) {
  return {
    type: SETTING_TOGGLE,
    setting,
  };
}

export function createToast(message, notificationType) {
  return {
    type: TOAST_CREATE,
    message,
    notificationType,
  };
}

export function popToast(index = 0) {
  return {
    type: TOAST_POP,
    index,
  };
}

export function search(searchTerm, options) {
  return {
    type: SEARCH,
    searchTerm,
    options,
  };
}

export function setTimeline(leftBoundaryTime, rightBoundaryTime) {
  return { type: TIMELINE_SET, leftBoundaryTime, rightBoundaryTime };
}

export function setThreadIncludeList(thread_ids: number[], inputValue: string) {
  return {
    type: SET_THREAD_INCLUDE_LIST,
    thread_ids,
    inputValue,
  };
}

export function setThreadExcludeList(thread_ids: number[], inputValue: string) {
  return {
    type: SET_THREAD_EXCLUDE_LIST,
    thread_ids,
    inputValue,
  };
}

export function filterTrace(selectedThreads) {
  return {
    type: TRACE_FILTER,
    selectedThreads,
  };
}

export function showAdvancedSearch() {
  return {
    type: ADVANCED_SEARCH_SHOW,
  };
}

export function hideAdvancedSearch() {
  return {
    type: ADVANCED_SEARCH_HIDE,
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

// shifting your attention to this thread
export function shiftAttention(thread_id, timestamp) {
  return {
    type: ATTENTION_SHIFT,
    thread_id,
    timestamp,
  };
}
