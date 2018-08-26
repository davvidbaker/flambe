import first from 'lodash/fp/first';
import tail from 'lodash/fp/tail';

import {
  SEARCH,
  SEARCH_RESULT,
  SEARCH_MATCH_INCREMENT_RESULT,
  SEARCH_BLOCK_INCREMENT_RESULT,
  SET_THREAD_INCLUDE_LIST,
  SET_THREAD_EXCLUDE_LIST,
} from '../actions';

const MAX_SEARCH_STACK_LENGTH = 20;

const defaultState = {
  matches: [],
  blocksForMatch: [],
  blockIndex: 0,
  matchIndex: 0,
  searchStack: [],
  options: {
    matchCase: false,
    matchWholeWord: false,
    useRegularExpression: false,
  },
  advancedOptions: {
    limitToVisibleSectionOfTimeline: false,
    threadIncludeList: [],
    threadExcludeList: [],
    activityStatuses: null,
    activityFields: 'name',
  },
  includeStack: [],
  excludeStack: [],
};

/* ⚠️ mutates */
function addToStack(value, stack) {
  if (first(stack) !== value) {
    stack = [value, ...(stack || [])];
    if (stack.length > MAX_SEARCH_STACK_LENGTH) {
      // remove last element
      stack = stack.slice(-1);
    }
  }

  return stack;
}

function search(state = defaultState, action) {
  switch (action.type) {
    /* 💁 this is mostly handled in sagas/search */
    case SEARCH:
      const searchStack = addToStack(action.searchTerm, state.searchStack);

      return {
        ...state,
        searchStack,
      };

    case SEARCH_RESULT:
      const { matches, blocksForMatch } = action;
      return {
        ...state,
        matches,
        blocksForMatch,
        blockIndex: 0,
        matchIndex: 0,
      };

    case SEARCH_MATCH_INCREMENT_RESULT:
      return {
        ...state,
        matchIndex: action.matchIndex,
        blocksForMatch: action.blocksForMatch,
        blockIndex: 0,
      };

    case SEARCH_BLOCK_INCREMENT_RESULT:
      return {
        ...state,
        blockIndex: action.blockIndex,
      };

    case SET_THREAD_INCLUDE_LIST:
      const includeStack = addToStack(action.inputValue, state.includeStack);

      return {
        ...state,
        advancedOptions: {
          ...state.advancedOptions,
          threadIncludeList: action.thread_ids,
        },
        includeStack,
      };

    case SET_THREAD_EXCLUDE_LIST:
      const excludeStack = addToStack(action.inputValue, state.excludeStack);

      return {
        ...state,
        advancedOptions: {
          ...state.advancedOptions,
          threadExcludeList: action.thread_ids,
        },
        excludeStack,
      };

    default:
      return state;
  }
}

export default search;
