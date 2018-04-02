import last from 'lodash/fp/last';

import {
  ATTENTION_SHIFT,
  CATEGORY_CREATE,
  CATEGORY_UPDATE,
  MANTRA_CREATE,
  TODO_BEGIN,
  TODO_CREATE,
  TRACE_DELETE,
  TRACE_CREATE,
  USER_FETCH
} from 'actions';

export const getUser = state => state.user;

function user(
  state = {
    name: 'david' /* ⚠️ TODO change */,
    id: '1',
    traces: [],
    categories: [],
    todos: [],
    mantras: [],
    attentionShifts: []
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
          { name: action.name, timestamp: Date.now() },
          ...state.mantras
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
      console.log('state.attentionShifts', state.attentionShifts);
      console.log('action', action);
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
          ({ thread_id, timestamp }) => ({
            timestamp: new Date(timestamp).getTime(),
            thread_id
          })
        )
      };

    case `${USER_FETCH}_FAILED`:
      return state;

    default:
      return state;
  }
}

export default user;
