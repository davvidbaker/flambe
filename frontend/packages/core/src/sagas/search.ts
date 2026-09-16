import { put, takeLatest, select } from 'redux-saga/effects';
import type { SagaIterator } from 'redux-saga';

import { getTimeline, type TimelineState } from '../reducers/timeline';
import type { SearchMatch, SearchState } from '../reducers/search';
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
  TOGGLE_SEARCH_OPTION,
} from '../actions';
import circularIncrement from '../utilities/circularIncrement';
import {
  compileSearchRegex,
  InvalidSearchRegexError,
} from '../utilities/activityMatchesSearch';

interface RootState {
  search: SearchState;
  timeline: TimelineState;
}

interface SearchAction {
  options: unknown;
  searchTerm: string;
  type: string;
}

interface IncrementAction {
  direction: 1 | -1;
  type: string;
}

function* handleSearch({ searchTerm }: SearchAction): SagaIterator {
  if (searchTerm.length <= 0) return;
  const timeline: TimelineState = yield select(getTimeline);
  const { advancedOptions, options }: SearchState = yield select((state: RootState) => state.search);
  const { threadIncludeList, threadExcludeList } = advancedOptions;

  const { activities, blocks } = timeline;

  try {
    const matcher = compileSearchRegex(searchTerm, options);
    const matches: SearchMatch[] = Object.entries(activities).filter(([_key, activity]) => {
      const threadId = activity.thread_id;
      if (threadIncludeList.length > 0 && !threadIncludeList.includes(threadId ?? '')) return false;
      if (threadExcludeList.length > 0 && threadExcludeList.includes(threadId ?? '')) return false;
      return Boolean(activity.name && matcher.test(activity.name));
    });

    if (matches.length > 0) {
      const match = matches[0];
      const activity_id = match[0];

      const blocksForMatch = blocksForActivityWithIndices(activity_id, blocks);

      yield put({ type: SEARCH_RESULT, matches, blocksForMatch });
    } else {
      yield put({ type: SEARCH_RESULT, matches, blocksForMatch: [] });
    }
  } catch (error) {
    if (error instanceof InvalidSearchRegexError) {
      yield put({
        type: SEARCH_RESULT,
        matches: [],
        blocksForMatch: [],
        searchError: error.message,
      });
      return;
    }
    throw error;
  }
}

function* handleMatchIncrement({ direction }: IncrementAction): SagaIterator {
  const searchState: SearchState = yield select((state: RootState) => state.search);
  const { blocks }: TimelineState = yield select(getTimeline);
  const matchCount = searchState.matches.length;

  const matchIndex = circularIncrement(
    direction,
    searchState.matchIndex,
    matchCount,
  );

  const match = searchState.matches[matchIndex];
  if (!match) return;

  const blocksForMatch = blocksForActivityWithIndices(
    Number(match[0]),
    blocks,
  );

  yield put({
    type: SEARCH_MATCH_INCREMENT_RESULT,
    matchIndex,
    blocksForMatch,
  });
}

function* handleBlockIncrement({ direction }: IncrementAction): SagaIterator {
  const searchState: SearchState = yield select((state: RootState) => state.search);
  const blockCount = searchState.blocksForMatch.length;

  const blockIndex = circularIncrement(
    direction,
    searchState.blockIndex,
    blockCount,
  );

  yield put({ type: SEARCH_BLOCK_INCREMENT_RESULT, blockIndex });
}

function* focusSearchResult(): SagaIterator {
  const { matches, matchIndex, blockIndex, blocksForMatch } = yield select(
    (state: RootState) => state.search,
  );

  if (matches.length > 0) {
    const match = matches[matchIndex];
    const activity_id = match && Number(match[0]);
    if (activity_id === undefined || Number.isNaN(activity_id)) return;

    if (!blocksForMatch[blockIndex]) return;
    const index = Number(blocksForMatch[blockIndex][0]);

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

    const lbt = Number.parseFloat(localStorage.getItem('lbt') ?? '');
    const rbt = Number.parseFloat(localStorage.getItem('rbt') ?? '');

    const resolvedEndTime = endTime ?? startTime;
    if (startTime > rbt || resolvedEndTime < lbt) {
      yield put(setTimeline(startTime, resolvedEndTime));
    }
  }
}

function* handleFilter(): SagaIterator {
  const { searchStack, options }: SearchState = yield select((state: RootState) => state.search);
  yield put(search(searchStack[0] ?? '', options));
}

function* searchSaga(): SagaIterator {
  yield takeLatest(SEARCH, handleSearch);
  yield takeLatest(SEARCH_MATCH_INCREMENT, handleMatchIncrement);
  yield takeLatest(SEARCH_BLOCK_INCREMENT, handleBlockIncrement);
  yield takeLatest(SET_THREAD_INCLUDE_LIST, handleFilter);
  yield takeLatest(SET_THREAD_EXCLUDE_LIST, handleFilter);
  yield takeLatest(TOGGLE_SEARCH_OPTION, handleFilter);
  yield takeLatest(
    ({ type }: { type: string }) => /SEARCH.*RESULT/.test(type),
    focusSearchResult,
  );
}

export default searchSaga;
