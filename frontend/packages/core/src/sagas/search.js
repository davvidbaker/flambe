import { pipe, filter, map, identity, mapKeys } from 'lodash/fp';
import { call, put, takeLatest, select } from 'redux-saga/effects';

import { getTimeline } from '../reducers/timeline';
import { blocksForActivityWithIndices } from '../utilities/timeline';

import {
  focusBlock,
  search,
  setTimeline,
  SEARCH,
  SEARCH_RESULT,
  SEARCH_MATCH_INCREMENT,
  SEARCH_BLOCK_INCREMENT,
  SEARCH_MATCH_INCREMENT_RESULT,
  SEARCH_BLOCK_INCREMENT_RESULT,
  SET_THREAD_INCLUDE_LIST,
  SET_THREAD_EXCLUDE_LIST,
} from '../actions';
import circularIncrement from '../utilities/circularIncrement';

/* ⚠️ TODO options */
function* handleSearch({ searchTerm, options }) {
  if (searchTerm.length <= 0) return;
  const timeline = yield select(getTimeline);
  const { advancedOptions } = yield select(state => state.search);
  const { threadIncludeList, threadExcludeList } = advancedOptions;

  const { activities, blocks } = timeline;
  console.log(`🔥  threadIncludeList`, threadIncludeList);
  console.log(`🔥  threadExcludeList`, threadExcludeList);

  const matches =
    activities
    |> Object.entries
    |> mapKeys(Number)
    |> (threadIncludeList.length > 0
      ? filter(([_key, val]) => threadIncludeList.includes(val.thread_id))
      : identity)
    |> (threadExcludeList.length > 0
      ? filter(([_key, val]) => !threadExcludeList.includes(val.thread_id))
      : identity)
    |> filter(([_key, val]) => val.name.includes(searchTerm));

  if (matches.length > 0) {
    const match = matches[0];
    const activity_id = match[0]

    const blocksForMatch = do {
      if (matches.length > 0) {
        blocksForActivityWithIndices(activity_id, blocks);
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

  const matchIndex = circularIncrement(
    direction,
    searchState.matchIndex,
    matchCount,
  );

  const blocksForMatch = blocksForActivityWithIndices(
    Number(searchState.matches[matchIndex][0]),
    blocks,
  );

  yield put({
    type: SEARCH_MATCH_INCREMENT_RESULT,
    matchIndex,
    blocksForMatch,
  });
}

function* handleBlockIncrement({ direction }: { direction: 1 | -1 }) {
  const searchState = yield select(state => state.search);
  const blockCount = searchState.blocksForMatch.length;

  const blockIndex = circularIncrement(
    direction,
    searchState.blockIndex,
    blockCount,
  );

  yield put({ type: SEARCH_BLOCK_INCREMENT_RESULT, blockIndex });
}

function* focusSearchResult() {
  const { matches, matchIndex, blockIndex, blocksForMatch } = yield select(
    state => state.search,
  );

  if (matches.length > 0) {
    const match = matches[matchIndex];
    const activity_id = Number(match[0]);
    const index = Number(blocksForMatch[blockIndex][0]);

    console.log(`🔥  index`, index);

    const activity = match[1];

    yield put(
      focusBlock({
        index,
        activity_id,
        activityStatus: activity.status,
        thread_id: activity.thread_id,
      }),
    );

    const { startTime, endTime } = blocksForMatch[blockIndex][1];

    const lbt = Number.parseFloat(localStorage.getItem('lbt'));
    const rbt = Number.parseFloat(localStorage.getItem('rbt'));

    if (startTime > rbt || endTime < lbt) {
      yield put(setTimeline(startTime, endTime));
    }

    // yield put(setTimeline())
  }
}

function* handleFilter() {
  const { searchStack, options } = yield select(state => state.search);
  /* ⚠️ options */
  console.log(`🔥  searchStack`, searchStack);
  yield put(search(searchStack[0], options));
}

function* searchSaga() {
  yield takeLatest(SEARCH, handleSearch);
  yield takeLatest(SEARCH_MATCH_INCREMENT, handleMatchIncrement);
  yield takeLatest(SEARCH_BLOCK_INCREMENT, handleBlockIncrement);
  yield takeLatest(SET_THREAD_INCLUDE_LIST, handleFilter);
  yield takeLatest(SET_THREAD_EXCLUDE_LIST, handleFilter);
  yield takeLatest(
    ({ type }) => /SEARCH.*RESULT/.test(type),
    focusSearchResult,
  );
}

export default searchSaga;
