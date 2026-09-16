import type { EntityId } from '../types/ids';
import type { TraceBlock } from '../utilities/processTrace';
import {
  SEARCH, SEARCH_RESULT, SEARCH_MATCH_INCREMENT_RESULT,
  SEARCH_BLOCK_INCREMENT_RESULT, SET_THREAD_INCLUDE_LIST, SET_THREAD_EXCLUDE_LIST,
  TOGGLE_SEARCH_OPTION,
} from '../actions';

import type { ProcessedActivity } from '../utilities/processTrace';
import type { SearchOptions } from '../utilities/activityMatchesSearch';

export type { SearchOptions };
export type SearchMatch = [string, ProcessedActivity];
export interface SearchState {
  matches: SearchMatch[]; blocksForMatch: Array<[number, TraceBlock]>; blockIndex: number; matchIndex: number;
  searchStack: string[]; includeStack: string[]; excludeStack: string[];
  options: SearchOptions;
  searchError: string | null;
  advancedOptions: { limitToVisibleSectionOfTimeline: boolean; threadIncludeList: EntityId[]; threadExcludeList: EntityId[]; activityStatuses: string[] | null; activityFields: string };
}
const defaultState: SearchState = { matches: [], blocksForMatch: [], blockIndex: 0, matchIndex: 0, searchStack: [], includeStack: [], excludeStack: [], options: { matchCase: false, matchWholeWord: false, useRegularExpression: false }, searchError: null, advancedOptions: { limitToVisibleSectionOfTimeline: false, threadIncludeList: [], threadExcludeList: [], activityStatuses: null, activityFields: 'name' } };
type SearchAction = { type: string; searchTerm?: string; matches?: SearchMatch[]; blocksForMatch?: Array<[number, TraceBlock]>; matchIndex?: number; blockIndex?: number; inputValue?: string; thread_ids?: EntityId[]; option?: keyof SearchOptions; searchError?: string | null };
function addToStack(value: string, stack: string[]): string[] { return stack[0] === value ? stack : [value, ...stack].slice(0, 20); }
function search(state: SearchState = defaultState, action: SearchAction): SearchState {
  switch (action.type) {
    case SEARCH: return { ...state, searchStack: addToStack(action.searchTerm ?? '', state.searchStack), searchError: null };
    case SEARCH_RESULT: return { ...state, matches: action.matches ?? [], blocksForMatch: action.blocksForMatch ?? [], blockIndex: 0, matchIndex: 0, searchError: action.searchError ?? null };
    case SEARCH_MATCH_INCREMENT_RESULT: return { ...state, matchIndex: action.matchIndex ?? 0, blocksForMatch: action.blocksForMatch ?? [], blockIndex: 0 };
    case SEARCH_BLOCK_INCREMENT_RESULT: return { ...state, blockIndex: action.blockIndex ?? 0 };
    case TOGGLE_SEARCH_OPTION: {
      const option = action.option;
      if (!option) return state;
      return { ...state, options: { ...state.options, [option]: !state.options[option] } };
    }
    case SET_THREAD_INCLUDE_LIST: return { ...state, advancedOptions: { ...state.advancedOptions, threadIncludeList: action.thread_ids ?? [] }, includeStack: addToStack(action.inputValue ?? '', state.includeStack) };
    case SET_THREAD_EXCLUDE_LIST: return { ...state, advancedOptions: { ...state.advancedOptions, threadExcludeList: action.thread_ids ?? [] }, excludeStack: addToStack(action.inputValue ?? '', state.excludeStack) };
    default: return state;
  }
}
export default search;
