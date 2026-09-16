import type { Trace } from '../types/Trace';
import type { EntityId } from '../types/ids';
import type { Thread } from '../types/Thread';
import type { TraceEvent, EventPhase } from '../types/TraceEvent';
import { getHiddenThreadIds } from '../utilities/threadHiddenState';

type Updates = Record<string, unknown>;
interface ActivityLifecycleInput { id: EntityId; timestamp: number; message?: string; thread_id: EntityId }

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
export const EVENT_DELETE = 'EVENT_DELETE';

export const UNDO_LAST_COMMAND = 'UNDO_LAST_COMMAND';
export const UNDO_RECORD = 'UNDO_RECORD';
export const UNDO_CLEAR = 'UNDO_CLEAR';

export const LOG_IN = 'LOG_IN';
export const LOG_OUT = 'LOG_OUT';

export const MANTRA_CREATE = 'MANTRA_CREATE';

export const SEARCH = 'SEARCH';
export const SEARCH_RESULT = 'SEARCH_RESULT';
export const SEARCH_MATCH_INCREMENT = 'SEARCH_MATCH_INCREMENT';
export const SEARCH_BLOCK_INCREMENT = 'SEARCH_BLOCK_INCREMENT';
export const SEARCH_MATCH_INCREMENT_RESULT = 'SEARCH_MATCH_INCREMENT_RESULT';
export const SEARCH_BLOCK_INCREMENT_RESULT = 'SEARCH_BLOCK_INCREMENT_RESULT';
export const TOGGLE_SEARCH_OPTION = 'TOGGLE_SEARCH_OPTION';

export const ADVANCED_SEARCH_SHOW = 'ADVANCED_SEARCH_SHOW';
export const ADVANCED_SEARCH_HIDE = 'ADVANCED_SEARCH_HIDE';

export const SETTING_SET = 'SETTING_SET';
export const SETTING_TOGGLE = 'SETTING_TOGGLE';

export const SETTINGS_SHOW = 'SETTINGS_SHOW';
export const SETTINGS_HIDE = 'SETTINGS_HIDE';

export const KEYBOARD_SHORTCUTS_SHOW = 'KEYBOARD_SHORTCUTS_SHOW';
export const KEYBOARD_SHORTCUTS_HIDE = 'KEYBOARD_SHORTCUTS_HIDE';
export const KEYBOARD_SHORTCUTS_TOGGLE = 'KEYBOARD_SHORTCUTS_TOGGLE';

export const THREAD_CREATE = 'THREAD_CREATE';
export const THREAD_DELETE = 'THREAD_DELETE';
export const THREAD_COLLAPSE = 'THREAD_COLLAPSE';
export const THREAD_EXPAND = 'THREAD_EXPAND';
export const THREAD_UPDATE = 'THREAD_UPDATE';
export const THREAD_HIDE = 'THREAD_HIDE';

export const THREADS_COLLAPSE_ALL = 'THREADS_COLLAPSE_ALL';
export const THREADS_REORDER = 'THREADS_REORDER';
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
export const USER_SETTINGS_UPDATE = 'USER_SETTINGS_UPDATE';

export const VIEW_CHANGE = 'VIEW_CHANGE';

export const SEARCH_TERMS_EVENT = 'SEARCH_TERMS_EVENT';
export const TABS_EVENT = 'TABS_EVENT';
export const CATEGORIES_EVENT = 'CATEGORIES_EVENT';

export const SET_THREAD_INCLUDE_LIST = 'SET_THREAD_INCLUDE_LIST';
export const SET_THREAD_EXCLUDE_LIST = 'SET_THREAD_EXCLUDE_LIST';

export function toggleTodos(bool: boolean) {
  return {
    type: TODOS_TOGGLE,
    bool,
  };
}

export function incrementBlock(direction: 1 | -1) {
  return {
    type: SEARCH_BLOCK_INCREMENT,
    direction,
  };
}

export function incrementMatch(direction: 1 | -1) {
  return {
    type: SEARCH_MATCH_INCREMENT,
    direction,
  };
}

// trace array of events -> object of activities
export function processTimelineTrace(events: TraceEvent[], threads: Thread[]) {
  return {
    type: PROCESS_TIMELINE_TRACE,
    events,
    threads,
  };
}

export function runCommand(operand: unknown, command: unknown) {
  return {
    type: COMMAND_RUN,
    operand,
    command,
  };
}

export function createThread(name: string, rank: number) {
  return {
    type: THREAD_CREATE,
    name,
    rank,
  };
}

export function collapseThread(id: EntityId) {
  return {
    type: THREAD_COLLAPSE,
    id,
  };
}

export function hideThread(id: EntityId) {
  return {
    type: THREAD_HIDE,
    id,
  };
}

export function reorderThreads(orderedIds: EntityId[]) {
  return {
    type: THREADS_REORDER,
    orderedIds,
  };
}

export function expandThread(id: EntityId) {
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

export function createTodo(name: string, description: string | null) {
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
}: { todo_id: EntityId; thread_id: EntityId; name: string; description: string | null; timestamp: number }) {
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
  color_text,
}: {
  activity_id?: EntityId;
  name: string;
  color_background: string;
  color_text?: string;
}) {
  return {
    type: CATEGORY_CREATE,
    activity_id,
    name,
    color_background,
    color_text,
  };
}

export function updateCategory(id: EntityId, updates: Updates) {
  return {
    type: CATEGORY_UPDATE,
    id,
    updates,
  };
}

export function createMantra(name: string) {
  return {
    type: MANTRA_CREATE,
    name,
  };
}

export function updateThread(id: EntityId, updates: Updates) {
  return {
    type: THREAD_UPDATE,
    id,
    updates,
  };
}

export function fetchUser(id: EntityId) {
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

export function deleteTrace(id: EntityId) {
  return {
    type: TRACE_DELETE,
    id,
  };
}

export function deleteThread(id: EntityId) {
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
  thread_id: EntityId /* message */,
  category_id: EntityId | null;
  phase: EventPhase;
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
  thread_id: EntityId /* message */,
  category_id: EntityId | null;
  phase: EventPhase;
}) {
  return {
    type: ACTIVITY_CREATE_Q,
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
}: ActivityLifecycleInput & { eventFlavor?: EventPhase }) {
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
export function suspendActivity({ id, timestamp, message, thread_id, weight }: ActivityLifecycleInput & { weight?: number }) {
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
export function resumeActivity({ id, timestamp, message, thread_id }: ActivityLifecycleInput) {
  return {
    type: ACTIVITY_RESUME,
    id,
    timestamp,
    message,
    thread_id,
  };
}

/** 💁 the thread_id is just being used here for optimystical updating threadLevels */
export function resurrectActivity({ id, timestamp, message, thread_id }: ActivityLifecycleInput) {
  return {
    type: ACTIVITY_RESURRECT,
    id,
    timestamp,
    message,
    thread_id,
  };
}

/** 💁 the thread_id is just being used here for optimystical updating threadLevels */
export function deleteActivity(id: EntityId, thread_id: EntityId) {
  return {
    type: ACTIVITY_DELETE,
    id,
    thread_id,
  };
}

/** 💁 the thread_id is just being used here for lastThread_id */
export function updateActivity(id: EntityId, updates: Updates) {
  return {
    type: ACTIVITY_UPDATE,
    id,
    updates,
  };
}

export function updateEvent(id: EntityId, updates: Updates) {
  return {
    type: EVENT_UPDATE,
    id,
    updates,
  };
}

export function deleteEvent(id: EntityId) {
  return {
    type: EVENT_DELETE,
    id,
  };
}

export function undoLastCommand() {
  return { type: UNDO_LAST_COMMAND };
}

export function recordUndo(target: unknown) {
  return { type: UNDO_RECORD, target };
}

export function clearUndo() {
  return { type: UNDO_CLEAR };
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

export function showKeyboardShortcuts() {
  return {
    type: KEYBOARD_SHORTCUTS_SHOW,
  };
}

export function hideKeyboardShortcuts() {
  return {
    type: KEYBOARD_SHORTCUTS_HIDE,
  };
}

export function toggleKeyboardShortcuts() {
  return {
    type: KEYBOARD_SHORTCUTS_TOGGLE,
  };
}

/** 💁 the thread_id is just being used here for optimistic updates when a command is run that operated on the activity */
export function focusBlock({ index, activity_id, activityStatus, thread_id }: { index: number | null; activity_id: EntityId | null; activityStatus?: string | null; thread_id: EntityId | null }) {
  return {
    type: BLOCK_FOCUS,
    index,
    activity_id,
    activityStatus,
    thread_id,
  };
}

export function hoverBlock(index: number | string | null) {
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
    trace: {
      ...trace,
      filterExcludes: trace.filterExcludes ?? getHiddenThreadIds(trace.id),
    },
  };
}

export function fetchTrace(trace: Trace | EntityId) {
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

export function changeView(view: string, thread_id?: EntityId) {
  return {
    type: VIEW_CHANGE,
    view,
    thread_id,
  };
}

export function fetchResource(
  resource: { type: string; id: string } | null,
  params: Record<string, unknown> | null = { method: 'GET' },
) {
  return {
    type: FETCH_RESOURCE,
    params,
    resource,
  };
}

export function toggleSetting(setting: string) {
  return {
    type: SETTING_TOGGLE,
    setting,
  };
}

export function setSetting(setting: string, value: boolean) {
  return {
    type: SETTING_SET,
    setting,
    value,
  };
}

export function createToast(message: string, notificationType: string) {
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

export function search(searchTerm: string, options?: unknown) {
  return {
    type: SEARCH,
    searchTerm,
    options,
  };
}

export function toggleSearchOption(option: 'matchCase' | 'matchWholeWord' | 'useRegularExpression') {
  return {
    type: TOGGLE_SEARCH_OPTION,
    option,
  };
}

export function setTimeline(leftBoundaryTime: number, rightBoundaryTime: number) {
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

export function setHiddenThreads(filterExcludes: EntityId[]) {
  return {
    type: TRACE_FILTER,
    filterExcludes,
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
export function shiftAttention(thread_id: EntityId, timestamp: number) {
  return {
    type: ATTENTION_SHIFT,
    thread_id,
    timestamp,
  };
}
