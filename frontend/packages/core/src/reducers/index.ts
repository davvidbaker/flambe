import {
  TODOS_TOGGLE,
  ADVANCED_SEARCH_SHOW,
  ADVANCED_SEARCH_HIDE,
  ACTIVITY_DETAILS_SHOW,
  ACTIVITY_DETAILS_HIDE,
  CATEGORY_MANAGER_SHOW,
  CATEGORY_MANAGER_HIDE,
  LOG_IN,
  LOG_OUT,
  SETTINGS_SHOW,
  SETTINGS_HIDE,
  VIEW_CHANGE,
} from '../actions';

import timeline from './timeline';
import modifiers from './modifiers';
import user from './user';
import operand from './operand';
import search from './search';
import settings from './settings';
import toaster from './toaster';
import type { EntityId } from '../types/ids';

interface RootAction {
  bool?: boolean;
  thread_id?: EntityId;
  type: string;
  view?: string;
}

function todosVisible(state = false, action: RootAction): boolean {
  switch (action.type) {
    case TODOS_TOGGLE:
      return action.bool ?? state;
    default:
      return state;
  }
}

function activityDetailModalVisible(state = false, action: RootAction): boolean {
  switch (action.type) {
    case ACTIVITY_DETAILS_SHOW:
      return true;
    case ACTIVITY_DETAILS_HIDE:
      return false;
    default:
      return state;
  }
}

function categoryManagerVisible(state = false, action: RootAction): boolean {
  switch (action.type) {
    case CATEGORY_MANAGER_SHOW:
      return true;
    case CATEGORY_MANAGER_HIDE:
      return false;
    default:
      return state;
  }
}

function settingsVisible(state = false, action: RootAction): boolean {
  switch (action.type) {
    case SETTINGS_SHOW:
      return true;
    case SETTINGS_HIDE:
      return false;
    default:
      return state;
  }
}

function view(state = 'multithread', action: RootAction): string {
  switch (action.type) {
    case VIEW_CHANGE:
      return action.view ?? 'multithread';
    default:
      return state;
  }
}

function viewThread(state: EntityId | null = null, action: RootAction): EntityId | null {
  switch (action.type) {
    case VIEW_CHANGE:
      return action.view === 'multithread' ? null : action.thread_id ?? null;
    default:
      return state;
  }
}

function advancedSearchVisible(state = false, action: RootAction): boolean {
  switch (action.type) {
    case ADVANCED_SEARCH_SHOW:
      return true;
    case ADVANCED_SEARCH_HIDE:
      return false;
    default:
      return state;
  }
}

function loggedIn(_state = false, _action: RootAction): boolean {
  return true;
  /* ⚠️ uncomment me */
  // switch (action.type) {
  //   case LOG_IN:
  //     return true;
  //   case LOG_OUT:
  //     return false;
  //   default:
  //     return state;
  // }
}

export {
  activityDetailModalVisible,
  advancedSearchVisible,
  categoryManagerVisible,
  loggedIn,
  modifiers,
  operand,
  search,
  settings,
  settingsVisible,
  timeline,
  todosVisible,
  toaster,
  user,
  view,
  viewThread,
};
