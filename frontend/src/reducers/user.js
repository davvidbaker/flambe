import last from 'lodash/fp/last';
import sortBy from 'lodash/fp/sortBy';
import map from 'lodash/fp/map';
import pipe from 'lodash/fp/pipe';

import {
  ATTENTION_SHIFT,
  CATEGORY_CREATE,
  CATEGORY_UPDATE,
  MANTRA_CREATE,
  TODO_BEGIN,
  TODO_CREATE,
  TRACE_DELETE,
  TRACE_CREATE,
  USER_FETCH,
  SEARCH_TERMS_EVENT,
  TABS_EVENT
} from 'actions';

export const getUser = state => state.user;

function timestampStringToTimestampInteger({ timestamp, ...rest }) {
  return {
    timestamp: new Date(timestamp).getTime(),
    ...rest
  };
}

function sortByTime(arr) {
  return pipe(
    map(timestampStringToTimestampInteger),
    sortBy(({ timestamp }) => timestamp)
  )(arr);
}

function user(
  state = {
    name: 'david' /* ⚠️ TODO change */,
    id: '1',
    traces: [],
    categories: [],
    todos: [],
    mantras: [],
    attentionShifts: [],
    search_terms: []
  },
  action
) {
  switch (action.type) {
    // 😃 optimism!
    case CATEGORY_CREATE:
      return {
        ...state,
        categories: [
          ...state.categories,
          {
            name: action.name,
            id: 'optimisticCategory',
            color_background: action.color_background,
            color_text: action.color_text || '#000000'
          }
        ]
      };
    // this is optimistic, need to handle failure
    case MANTRA_CREATE:
      return {
        ...state,
        mantras: [
          ...state.mantras,
          { name: action.name, timestamp: Date.now() }
        ]
      };
    /** ⚠️ need to make sure the user doesn't do anything before this tho...
     */
    case `${CATEGORY_CREATE}_SUCCEEDED`:
      return {
        ...state,
        categories: state.categories.map(
          cat =>
            (cat.id === 'optimisticCategory'
              ? { ...cat, id: action.data.id }
              : cat)
        )
      };
    /** ⚠️ TODO handle category failure (AND OTHER TYPES TOO!) */

    case CATEGORY_UPDATE:
      return {
        ...state,
        categories: state.categories.map(
          cat => (cat.id === action.id ? { ...cat, ...action.updates } : cat)
        )
      };
    /* ⚠️ this is optimistic, need to handle failure */
    case ATTENTION_SHIFT:
      return action.thread_id === last(state.attentionShifts.thread_id)
        ? state
        : {
          ...state,
          attentionShifts: [
            ...state.attentionShifts,
            { timestamp: action.timestamp, thread_id: action.thread_id }
          ]
        };
    // 😃 optimism!

    case TODO_CREATE:
      return {
        ...state,
        todos: [
          ...state.todos,
          {
            name: action.name,
            description: action.description,
            id: 'optimisticTodo'
          }
        ]
      };

    case `${TODO_CREATE}_SUCCEEDED`:
      return {
        ...state,
        todos: state.todos.map(
          todo =>
            (todo.id === 'optimisticTodo'
              ? { ...todo, id: action.data.id }
              : todo)
        )
      };

    case TODO_BEGIN:
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.todo_id)
      };

    case TRACE_DELETE:
      return {
        ...state,
        traces: state.traces.filter(trace => trace.id !== action.id)
      };
    /** 💁 optimistic update... */
    case TRACE_CREATE:
      return {
        ...state,
        traces: [...state.traces, { name: action.name, id: -1 }]
      };
    /** ...then update id when received
     *
     * ⚠️ need to make sure the user doesn't do anything before this tho...
     */
    case `${TRACE_CREATE}_SUCCEEDED`:
      return {
        ...state,
        traces: state.traces.map(
          trace =>
            (trace.name === action.data.name
              ? { ...trace, id: action.data.id }
              : trace)
        )
      };
    /** ⚠️ TODO handle TRACE_CREATE_FAILED */

    case `${USER_FETCH}_SUCCEEDED`:
      return {
        ...action.data,
        attentionShifts: action.data.attentionShifts.map(
          timestampStringToTimestampInteger
        ),
        mantras: sortByTime(action.data.mantras),
        searchTerms: sortByTime(action.data.searchTerms),
        tabs: sortByTime(action.data.tabs)
      };

    case `${USER_FETCH}_FAILED`:
      return state;

    case SEARCH_TERMS_EVENT:
      return {
        ...state,
        searchTerms: [
          ...state.searchTerms,
          { term: action.term, timestamp: action.timestamp }
        ]
      };

    case TABS_EVENT:
      return {
        ...state,
        tabs: [
          ...state.tabs,
          {
            count: action.tabs_count,
            timestamp: action.timestamp,
            window_count: action.window_count
          }
        ]
      };

    default:
      return state;
  }
}

export default user;
