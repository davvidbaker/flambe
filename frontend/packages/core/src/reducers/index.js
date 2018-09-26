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

function todosVisible(state = false, action) {
  switch (action.type) {
    case TODOS_TOGGLE:
      return action.bool;
    default:
      return state;
  }
}

function activityDetailModalVisible(state = false, action) {
  switch (action.type) {
    case ACTIVITY_DETAILS_SHOW:
      return true;
    case ACTIVITY_DETAILS_HIDE:
      return false;
    default:
      return state;
  }
}

function categoryManagerVisible(state = false, action) {
  switch (action.type) {
    case CATEGORY_MANAGER_SHOW:
      return true;
    case CATEGORY_MANAGER_HIDE:
      return false;
    default:
      return state;
  }
}

function settingsVisible(state = false, action) {
  switch (action.type) {
    case SETTINGS_SHOW:
      return true;
    case SETTINGS_HIDE:
      return false;
    default:
      return state;
  }
}

function view(state = 'multithread', action) {
  switch (action.type) {
    case VIEW_CHANGE:
      return action.view;
    default:
      return state;
  }
}

function viewThread(state = null, action) {
  switch (action.type) {
    case VIEW_CHANGE:
      return action.view === 'multithread' ? null : action.thread_id;
    default:
      return state;
  }
}

function advancedSearchVisible(state = false, action) {
  switch (action.type) {
    case ADVANCED_SEARCH_SHOW:
      return true;
    case ADVANCED_SEARCH_HIDE:
      return false;
    default:
      return state;
  }
}

function loggedIn(state = false, action) {
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
