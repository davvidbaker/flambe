import {
  SEARCH_RESULT,
  SEARCH_MATCH_INCREMENT_RESULT,
  SEARCH_BLOCK_INCREMENT_RESULT
} from '../actions';

const defaultState = {
  matches: [],
  blocksForMatch: [],
  blockIndex: 0,
  matchIndex: 0
};

function search(state = defaultState, action) {
  switch (action.type) {
    case SEARCH_RESULT:
      const { matches, blocksForMatch } = action;
      return {
        ...state,
        matches,
        blocksForMatch,
        blockIndex: 0,
        matchIndex: 0
      };
    case SEARCH_MATCH_INCREMENT_RESULT:
      return {
        ...state,
        matchIndex: action.matchIndex,
        blocksForMatch: action.blocksForMatch,
        blockIndex: 0
      };
    case SEARCH_BLOCK_INCREMENT_RESULT:
      return {
        ...state,
        blockIndex: action.blockIndex
      };
    default:
      return state;
  }
}

export default search;
