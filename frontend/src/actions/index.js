// @flow

export const PROCESS_TIMELINE_TRACE = 'PROCESS_TIMELINE_TRACE';
export const REFLECT_PROCESSED_TRACE = 'REFLECT_PROCESSED_TRACE';
export const ADD_EVENT = 'ADD_EVENT';
export const ZOOM_TIMELINE = 'ZOOM_TIMELINE';
export const PAN_TIMELINE = 'PAN_TIMELINE';
export const SELECT_TRACE = 'SELECT_TRACE';
export const FOCUS_ACTIVITY = 'FOCUS_ACTIVITY';
export const HOVER_ACTIVITY = 'HOVER_ACTIVITY';
export const UPDATE_ACTIVITY = 'UPDATE_ACTIVITY';
export const UPDATE_THREAD_LEVEL = 'UPDATE_THREAD_LEVEL';
export const DELETE_CURRENT_TRACE = 'DELETE_CURRENT_TRACE';
export const KEY_DOWN = 'KEY_DOWN';
export const KEY_UP = 'KEY_UP';
export const FETCH_RESOURCE = 'FETCH_RESOURCE';

import type { Trace } from 'types/Trace';
// trace array of events -> object of activities
export function processTimelineTrace(events, threads) {
  return {
    type: PROCESS_TIMELINE_TRACE,
    events,
    threads,
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

export function updateActivity(id, updates: {}) {
  return {
    type: UPDATE_ACTIVITY,
    id,
    updates,
  };
}

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
    type: SELECT_TRACE,
    trace,
  };
}

export function deleteCurrentTrace() {
  return {
    type: DELETE_CURRENT_TRACE,
  };
}

export function fetchResource(resource: ?{type: string, id: string}) {
  return {
    type: FETCH_RESOURCE,
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
  minTime: number
) {
  return {
    type: ZOOM_TIMELINE,
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
  minTime: number
) {
  return {
    type: PAN_TIMELINE,
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
