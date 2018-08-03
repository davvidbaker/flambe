import { getTimeline } from '../reducers/timeline';
import {
  focusBlock,
  setTimeline,
  SEARCH,
  SEARCH_RESULT,
  SEARCH_MATCH_INCREMENT,
  SEARCH_BLOCK_INCREMENT,
  SEARCH_MATCH_INCREMENT_RESULT,
  SEARCH_BLOCK_INCREMENT_RESULT
} from '../actions';

import { call, put, takeLatest, select } from 'redux-saga/effects';

function getBlocksForMatch(blocks, activity_id) {
  return Object.entries(blocks).filter(([_key, val]) => val.activity_id === activity_id);
}

/* ⚠️ TODO options */
function* handleSearch({ searchTerm, options }) {
  const timeline = yield select(getTimeline);
  const { activities, blocks } = timeline;

  const matches = Object.entries(activities).filter(([_key, val]) =>
    val.name.includes(searchTerm));

  if (matches.length > 0) {
    const match = matches[0];
    const activity_id = Number(match[0]);

    const blocksForMatch = do {
      if (matches.length > 0) {
        getBlocksForMatch(blocks, activity_id);
      } else {
        [];
      }
    };

    yield put({ type: SEARCH_RESULT, matches, blocksForMatch });
  } else {
    yield put({ type: SEARCH_RESULT, matches, blocksForMatch: [] });
  }
}

function* handleMatchIncrement({ direction }) {
  const searchState = yield select(state => state.search);
  const { blocks } = yield select(getTimeline);
  const matchCount = searchState.matches.length;

  const matchIndex =
    searchState.matchIndex + direction < 0
      ? matchCount - 1
      : (searchState.matchIndex + direction) % matchCount;

  const blocksForMatch = getBlocksForMatch(
    blocks,
    Number(searchState.matches[matchIndex][0])
  );

  yield put({
    type: SEARCH_MATCH_INCREMENT_RESULT,
    matchIndex,
    blocksForMatch
  });
}

function* handleBlockIncrement({ direction }) {
  const searchState = yield select(state => state.search);
  const blockCount = searchState.blocksForMatch.length;

  const blockIndex =
    searchState.blockIndex + direction < 0
      ? blockCount - 1
      : (searchState.blockIndex + direction) % blockCount;
  yield put({ type: SEARCH_BLOCK_INCREMENT_RESULT, blockIndex });
}

function* focusSearchResult() {

  const {
    matches, matchIndex, blockIndex, blocksForMatch
  } = yield select(state => state.search);

  if (matches.length > 0) {
    const match = matches[matchIndex];
    const activity_id = Number(match[0]);
    const index = Number(blocksForMatch[blockIndex][0]);

    const activity = match[1];

    yield put(focusBlock({
      index,
      activity_id,
      activityStatus: activity.status,
      thread_id: activity.thread_id
    }));

    const { startTime, endTime } = blocksForMatch[blockIndex][1];

    const lbt = Number.parseFloat(localStorage.getItem('lbt'));
    const rbt = Number.parseFloat(localStorage.getItem('rbt'));

    if (startTime > rbt || endTime < lbt) {
      yield put(setTimeline(startTime, endTime));
    }

    // yield put(setTimeline())
  }
}

function* searchSaga() {
  yield takeLatest(SEARCH, handleSearch);
  yield takeLatest(SEARCH_MATCH_INCREMENT, handleMatchIncrement);
  yield takeLatest(SEARCH_BLOCK_INCREMENT, handleBlockIncrement);
  yield takeLatest(
    ({ type }) => /SEARCH.*RESULT/.test(type),
    focusSearchResult
  );
}

export default searchSaga;
